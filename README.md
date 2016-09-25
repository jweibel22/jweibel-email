# jweibel-email

This repository contains the implementation of an email service that when given sender and receiver email adresses, a subject and a body, provided by the user through a simple web page, will dispatch the email.
The service has been deployed with Heroku and is accessible from here: https://jweibel-email.herokuapp.com/

Choice of platform:
The service has been written in javascript. The front-end is built with the Angular framework, the backend is built with node.js.
As I've primarily been working with Java and .Net I don't have extensive experience with javascript. I have some experience on the front-end side but very little prior experience with Node.js.
Considering that javascript is a popular language at Uber I decided to take the opportunity to gain some experience with building a backend in Node.js.
For this reason I'm not familiar with all javascript and node.js best practices or the contents of the npm.

Requirements:
The requirements from the coding-challenge were very vague but the ability to fail-over to another email provider suggests availability.
I have aimed at making the service both highly available and scalable.

The solution:
The service consists of 3 components:
A front-end: It has a single web page containing an HTML form where the user can input the necessary information and a send button that will post the content to the web server.
A web server: Accepts "send email" requests from the front-end, validates the contents and if valid publishes the email as a message to a RabbitMQ server.
A worker: Listens for "send email" messages on RabbitMQ. When a message arrives it will try to dispatch the email using one of the configured email providers.


Technology choices:
Angular.js
The front-end is extremely simple. A simple http form, some input validation, a postback to the webserver, and a toaster for displaying errors.
A reasonable alternative to utilizing angular.js would have been to use a simple html form with a submit button, and some "native" javascript for handling input validation and the toaster.
By utilizing angular.js, which involves almost no boilerplate code and no additional configuration we now have a standardized code structure, with clear sepearation of concerns between the MVC parts and 
the other parts (the services). Angular provides input validation out of the box and by utilizing the binding abilities of Angular we get very clean code. 
This all results in better readability/maintainability.

Node.js
Node.js is very simple to set up. The single-threaded nature of node.js makes it easier to reason about correctness and in our case multithreading would reap no benefits anyway.
The ability to spin up new threads in a web server makes good sense if some requests involves CPU intensive work and we want to stay available.
In our case all requests follow the same pattern, they publish the contents of the request to RabbitMQ and returns (no cpu intensive work). While waiting for RabbitMQ to respond, node.js can utilize the thread for handling another request. 
Since all requests behave in this way (regardless of user input), performance of the web server is very predictive. Thus scaling up or down (applying a load balancer and deploying mulitple versions of the web server) as traffic patterns change is also quite easy.

RabbitMQ
We needed a message broker, and since I have experience with RabbitMQ, it seemed like a natural choice.
The client library "jackrabbit" was chosen for its simplicity.
It does, however, have a couple of serious limitations, that would have to be addressed if this system were to go into production:
It doesn't have an async version of the exchange.publish method, so currently the request thread is blocked every time we publish to rabbitmQ.
It doesn't support "publish confirms", meaning we don't get a confirmaion that our message has been handled and persisted in RabbitMQ when we call the publish method.

Architecture choices:
Basically the service performs two activities. Taking requests from the users and dispatching the emails.
We have chosen to separate the processing of these two activities into two different services, a web server is taking requests and a worker is dispatching the emails.
The web server and the worker communicates asynchronously over RabbitMQ.
The introduction of a message broker between the web server and the worker has many benefits:
Scalability:
It decouples the two activities and enables us to scale them independently.
Utilizing RabbitMQ simplifies the fail-over logic. By applying the circuit breaker pattern we keep track of the avilability of the providers and try to dispatch the email to an available provider (if any) and if it fails we NACK the message which means that RabbitMQ will redeliver it later.
Scaling up the dispatching of emails is simply a matter of deploying multiple workers (each configured with their own email provider), they will consume from the same queue and RabbitMQ will take care of the load balancing.

Availability:
The availability of our service isn't dependent on the availability of our email providers, if no email providers are available we can still take requests and queue them on RabbitMQ.
It improves the elasticity of our service. If we receive more requests than our email providers can handle at peak periods we can still enqueue them and process them later, with no inconvenience for the end user (despite a delay in the dispatching)
Simplicity:
The process of dispatching the emails is not constrained by the synchronous nature of the web request, where a user is waiting for a reply. 
As long as we dispatch the email eventually (within a reasonable amount of time of course) the user will be satisfied. 
This means we don't have to take HTTP timeouts into consideration or an impatient user cancelling the request (and what to do if that happens if we have already dispatched the email)
It also means that the user will get a response quickly, he doesn't have to wait for our request to the email providers to go through.

What is missing:
Authentication in the front-end. 
Anyone can send emails, even robots. So what about DOS attacks or mailicious users?

Encryption. 
The web server is not using SSL encryption, which is essential since emails are private data.

Handling of "poison messages" in the worker. 
Due to our choice of dispatching the emails asynchronously, once we successfully valiate an email and publish it to rabbitMQ the user will get back an HTTP OK even though the email hasn't been dispatched yet.
We're essentially returning a promise to the user that we're going to dispatch the email eventually.
If we ensure that our validation checks are at least as strong as the combined constraints of our email providers this shouldn't be a problem.
Of course, due to misinterpretations of the email provider APIs or bugs in the code we may still find ourselves in a situation where we're unable to dispatch an email.
We need a way of dealing with this situation. We should either forward these "poison messages" to a different queue on RabbitMQ and let our support department deal with these situations case-by-case or send a reply to the "sender" email address of the email with an apology.
angular.module('jweibel-email', ['ui.bootstrap', 'toaster'])
    .run(['townCrier', function(townCrier) {
        townCrier.initialize();
    }
    ]);


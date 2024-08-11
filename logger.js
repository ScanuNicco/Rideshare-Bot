const constants = require('./constants.js');

module.exports = {
    logInfo: function(message) {
        console.log(`[\x1b[1;33mINFO\x1b[0m]:`, message);
    },
    logDebug: function(message) {
        if(constants.VERBOSE){
            console.log(`[\x1b[1;34mDEBUG\x1b[0m]:`, message);
        }
    },
    logError: function(message) {
        console.log(`[\x1b[1;31mERROR\x1b[0m]:`, message);
    },
    writeBanner: function() {
        console.log("\x1b[31m######                                                        ######               \n#     # # #####  ######  ####  #    #   ##   #####  ######    #     #  ####  ##### \n#     # # #    # #      #      #    #  #  #  #    # #         #     # #    #   #   \n######  # #    # #####   ####  ###### #    # #    # #####     ######  #    #   #   \n#   #   # #    # #           # #    # ###### #####  #         #     # #    #   #   \n#    #  # #    # #      #    # #    # #    # #   #  #         #     # #    #   #   \n#     # # #####  ######  ####  #    # #    # #    # ######    ######   ####    #   ");
        console.log("\x1b[1;37m --------------------------------- \x1b[34mVersion " + constants.VERSION + "\x1b[37m ---------------------------------\x1b[0m\n");
    }
};

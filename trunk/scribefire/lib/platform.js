if (typeof opera != "undefined") {
	var platform = "presto";
	var browser = "opera";
}
else if (typeof Components != 'undefined') {
	var platform = "gecko";
	var browser = 'firefox';
}
else {
	var platform = "webkit";

	if (typeof chrome != 'undefined') {
		var browser = 'chrome';
	}
	else {
		var browser = 'safari';
	}
}

var SCRIBEFIRE_STRINGS = {
	"strings" : {},

	get : function (key, substitutions) {
		if (key in this.strings) {
			var bundle = this.strings[key];

			var message = this.strings[key].message;

			if ("placeholders" in bundle) {
				for (var i in bundle.placeholders) {
					var regex = new RegExp("\\$" + i + "\\$", "g");
					message = message.replace(regex, bundle.placeholders[i].content);
				}
			}

			if (substitutions) {
				for (var i = 0, _len = substitutions.length; i < _len; i++) {
					var regex = new RegExp("\\$" + (i+1), "g");
					message = message.replace(regex, substitutions[i]);
				}
			}

			return message;
		}

		return "";
	}
};

if (platform == 'gecko') {
	if (typeof console == 'undefined') {
		var console = {
			log : function (msg) {
				var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
				consoleService.logStringMessage(msg);
			}
		};
	}
	
	if ("@mozilla.org/extensions/manager;1" in Components.classes) {
		(function (extension_id, string_object) {
			var defaultLocale = "en_US";
		
			var extensionManager = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
			var installLocation = extensionManager.getInstallLocation(extension_id);
		
			// Get the user's Firefox locale.
			var userLocale = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("general.useragent.").getCharPref("locale");

			// Convert the userLocale to Chrome style.
			var userLocaleParts = userLocale.split("-");
			if (userLocaleParts.length > 1) userLocaleParts[1] = userLocaleParts[1].toUpperCase();
			userLocale = userLocaleParts.join("_");

			var localeOrder = [defaultLocale];

			if (userLocale != defaultLocale) {
				if ((underscoreIndex = userLocale.indexOf("_")) != -1) {
					localeOrder.push(userLocale.substr(0, underscoreIndex));
				}
				localeOrder.push(userLocale);
			}

			// Starting with the default, pull in all of the strings for each locale, 
			// overwriting previous ones if necessary.
			localeOrder.forEach(function (locale) {
				if (typeof installLocation != 'undefined') {
					var messagesFile = installLocation.getItemFile(extension_id, "chrome/content/_locales/" + locale + "/messages.json");
				}
				else {
					Components.utils.import("resource://gre/modules/AddonManager.jsm");
				
					AddonManager.getAddonByID("next@scribefire.com", function (addon) {
						var addonLocation = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file;
					  });
				}
				var messagesText = FileIO.read(messagesFile);
			
				if (messagesText) {
					var messages = {};
				
					try {
						messages = JSON.parse(messagesText);
					} catch (e) {
						// Invalid JSON.
					}
				
					for (var i in messages) {
						string_object[i] = messages[i];
					}
				}
			});
		})("next@scribefire.com", SCRIBEFIRE_STRINGS.strings);
	}
	else {
		(function (extension_id, string_object) {
			var defaultLocale = "en_US";
			
			Components.utils.import("resource://gre/modules/AddonManager.jsm");  
			
			AddonManager.getAddonByID(extension_id, function (addon) {
				var addonLocation = addon.getResourceURI("").QueryInterface(Components.interfaces.nsIFileURL).file;
			
				// Get the user's Firefox locale.
				var userLocale = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("general.useragent.").getCharPref("locale");

				// Convert the userLocale to Chrome style.
				var userLocaleParts = userLocale.split("-");
				if (userLocaleParts.length > 1) userLocaleParts[1] = userLocaleParts[1].toUpperCase();
				userLocale = userLocaleParts.join("_");

				var localeOrder = [defaultLocale];

				if (userLocale != defaultLocale) {
					if ((underscoreIndex = userLocale.indexOf("_")) != -1) {
						localeOrder.push(userLocale.substr(0, underscoreIndex));
					}
					localeOrder.push(userLocale);
				}

				// Starting with the default, pull in all of the strings for each locale, 
				// overwriting previous ones if necessary.
				localeOrder.forEach(function (locale) {
					var messagesFile = addon.getResourceURI("chrome/content/_locales/" + locale + "/messages.json").QueryInterface(Components.interfaces.nsIFileURL).file;
					console.log(messagesFile);
					var messagesText = FileIO.read(messagesFile);
			
					if (messagesText) {
						var messages = {};
				
						try {
							messages = JSON.parse(messagesText);
						} catch (e) {
							// Invalid JSON.
						}
				
						for (var i in messages) {
							string_object[i] = messages[i];
						}
					}
				});
				
				localize();
			});
		})("next@scribefire.com", SCRIBEFIRE_STRINGS.strings);
	}
}
else if (browser == 'safari' || browser == 'opera') {
	// SCRIBEFIRE_MESSAGES is generated by the Safari and Opera build scripts.
	SCRIBEFIRE_STRINGS.strings = SCRIBEFIRE_MESSAGES;
}

function scribefire_string(key, substitutions) {
	if (typeof substitutions != 'undefined') {
		if (typeof substitutions != 'object') {
			substitutions = [ substitutions ];
		}
	}
	
	if (browser == 'chrome') {
		return chrome.i18n.getMessage(key, substitutions);
	}
	else {
		return SCRIBEFIRE_STRINGS.get(key, substitutions);
	}
}

var style = document.createElement("link");
style.setAttribute("rel", "stylesheet");
style.setAttribute("type", "text/css");
style.setAttribute("href", "skin/platform." + platform + ".css");
document.getElementsByTagName("head")[0].appendChild(style);
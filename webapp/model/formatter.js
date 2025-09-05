/**
 * @file formatter.js
 * @description Uygulama genelinde kullanılacak formatlama fonksiyonları
 * @version 1.0.1
 * @author Ali Haydar Sayar
 * @date 2025-08-25
 */
sap.ui.define([], function () {
	"use strict";

	return {
		formatUlke: function (sValue) {

			if (!sValue) {
				return "";
			}
			if (sValue === "TUR" || sValue === "Tur") {
				return "Türkiye"
			}

			return sValue;
		}




	};
});


// sap.ui.define([

// ], () => {
// 	"use strict";


// 	const formatter = {
// 		formatUlke: function (sValue) {
// 			sValue = "Test"

// 			return sValue;
// 		}

// 	};

// 	return formatter;
// });
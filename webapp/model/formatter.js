sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function(NumberFormat) {
	"use strict";

	var formatter = {

		formatMeetingInfo: function(oLocation, iDateTime) {
			var oDateTime = new Date(parseInt(iDateTime));
			var sLocalTime = oDateTime.toLocaleTimeString();
			return "Location - " + oLocation.name + " " + sLocalTime;
		},
		formatDateTime: function(iDateTime) {
			var options = {
				hour: "2-digit",
				minute: "2-digit"
			};
			var oDateTime = new Date(parseInt(iDateTime));
			var sLocalTime = oDateTime.toLocaleTimeString("en-us", options);
			return sLocalTime;
		},

		formatAppointmentImg: function(sType) {
			switch (sType) {
				case "Meeting":
					return "img/b1.png";
					break;
				case "All Hands":
					return "img/c1.png";
					break;
				case "People":
					return "img/a1.png";
					break;
				default:
					return "img/NewsImage.png";
			}
		}
	};

	return formatter;
});

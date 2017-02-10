sap.ui.define([
	"sap/ui/core/Control", "sap/m/VBox"
], function(Control, VBox) {
	"use strict";
	return Control.extend("sap.dm.control.map.Map", {
		metadata: {
			properties: {
				location: {
					type: "string"
				},
				destination: {
					type: "string"
				},
				orientation: {
					type: "float",
					defaultValue: 0
				},
				isThumbnail: {
					type: "boolean",
					defaultValue: false
				}
			},

			aggregations: {
				_VBox: {
					type: "sap.m.VBox",
					visibility: "hidden",
					multiple: false
				}
			},

			events: {
				showThumbnail: {},
				showFullsize: {}
			}
		},

		_iZoomRatio: null,

		_fOriginalX: null,
		_fOriginalY: null,
		_fCurrentX: null,
		_fCurrentY: null,

		_oSvg: null,
		_oMap: null,
		_oSettingBtn: null,
		_oFacilityBtn: null,
		_oZoomInBtn: null,
		_oZoomOutBtn: null,
		_oResetBtn: null,
		_oInfoPopup: null,

		_oLocIcon: null,
		_oDestIcon: null,
		_oNaviPath: null,

		_oFacilityIcon: null,
		_oCoffeeIcon:null,

		_aPathData: null,
		_aThumbnailData: null,
		_sLocation: null,
		_sDestination: null,
		_fOrientation: null,
		_bIsThumbnail: null,
		
		_fOriOffset:null,
		_bToolbarExpanded: null,

		init: function() {
			var oVBox = sap.ui.xmlfragment(this.getId(), "sap.dm.control.map.map");
			this.setAggregation("_VBox", oVBox);

			this._initParams();
		},

		onAfterRendering: function() {
			this._sLocation = this.getProperty("location");
			this._sDestination = this.getProperty("destination");
			this._bIsThumbnail = this.getProperty("isThumbnail");
			this._fOrientation = this.getProperty("orientation") - this._fOriOffset;

			if (this._bIsThumbnail) {
				this._showInThumbnail();
			} else {
				if (this._oSvg) {
					this._calcPath();
					this._highlightDestination();
					var sLocationInfo = "Location: " + this._sLocation + " Destination: " + this._sDestination;
					this._oSvg.select(this._getId("locationinfo")).attr("text", sLocationInfo);
				} else {
					this._showInFullsize();
				}

			}
		},

		_showInThumbnail: function() {
			var that = this;
			that._initControls();
			that._hideFullScreenToolbar();
			that._attachShowFullsizeEvt();
			
			this._getPathData().then(function() {
				return that._getThumbnailData();
			}).then(function() {		
				that._calcPath();
				that._highlightDestination();
				that._adjustViewBox();
			});
		},

		_showInFullsize: function() {
			var that = this;
			that._initControls();

			this._getPathData().then(function() {
				return that._getThumbnailData();
			}).then(function() {
				that._prepareMap();
				that._prepareSettingBtn();
				//that._prepareFacilityBtn();
				that._prepareZoomInBtn();
				that._prepareZoomOutBtn();
				that._prepareResetBtn();
				that._hideThumbnailToolbar();
				that._attachShowThumbnailEvt();
				that._animateCoffeeIcon();
				that._attachCoffeeIconEvt();
				that._attachInfoPopupEvt();
				
				var sLocationInfo = "Location: " + that._sLocation + " Destination: " + that._sDestination;
				that._oSvg.select(that._getId("locationinfo")).attr("text", sLocationInfo);
			});
		},

		_initParams: function() {
			this._iZoomRatio = 1;

			this._fOriginalX = 0;
			this._fOriginalY = 0;
			this._fCurrentX = 0;
			this._fCurrentY = 0;
			this._bToolbarExpanded = false;
			
			this._fOriOffset = 227;
		},

		_initControls: function() {
			this._oSvg = Snap(this._getId("svg"));
			this._oMap = this._oSvg.select(this._getId("map"));

			this._oSettingBtn = this._oSvg.select(this._getId("setting"));
			this._oFacilityBtn = this._oSvg.select(this._getId("facility"));
			this._oZoomInBtn = this._oSvg.select(this._getId("zoomin"));
			this._oZoomOutBtn = this._oSvg.select(this._getId("zoomout"));
			this._oResetBtn = this._oSvg.select(this._getId("reset"));

			this._oLocIcon = this._oMap.select(this._getId("locationicon"));
			this._oDestIcon = this._oMap.select(this._getId("desticon"));
			
			this._oCoffeeIcon = this._oSvg.select(this._getId("coffeeicon"));
			this._oFacilityIcon = this._oSvg.select(this._getId("facilityicon"));

			this._oInfoPopup = this._oSvg.select(this._getId("information"));
		},

		_prepareMap: function() {
			this._enableDrag();
			this._calcPath();
			this._highlightDestination();
		},

		_prepareSettingBtn: function() {
			var that = this;
			this._oSettingBtn.touchend(function() {
				if (that._oResetBtn.attr("display") === "none") {
					that._showResetBtn();
					that._showZoomInBtn();
					that._showZoomOutBtn();
					//that._showFacilityBtn();
				} else {
					that._hideResetBtn();
					that._hideZoomInBtn();
					that._hideZoomOutBtn();
					//that._hideFacilityBtn();
				}
			});
		},

		_prepareFacilityBtn: function() {
			var that = this;
			var aRoomNames = this._oSvg.selectAll(".room-name")
			this._oFacilityBtn.touchend(function() {
				if (that._oFacilityIcon.attr("display") === "none") {
					that._oFacilityIcon.attr("display", "block");
					aRoomNames.forEach(function(oRoomName){
						oRoomName.attr("display", "none");
					});
				} else {
					that._oFacilityIcon.attr("display", "none");
					aRoomNames.forEach(function(oRoomName){
						oRoomName.attr("display", "block");
					});
				}

			});
		},

		_prepareZoomInBtn: function() {
			var that = this;
			this._oZoomInBtn.touchend(function() {
				that._iZoomRatio = that._iZoomRatio * 1.2;
				that._oMap.animate({
					transform: 't' + that._fCurrentX + ',' + that._fCurrentY + "s" + that._iZoomRatio
				}, 200, mina.linear);
			});
		},

		_prepareZoomOutBtn: function() {
			var that = this;
			this._oZoomOutBtn.touchend(function() {
				that._iZoomRatio = that._iZoomRatio * 0.8;
				that._oMap.animate({
					transform: 't' + that._fCurrentX + ',' + that._fCurrentY + "s" + that._iZoomRatio
				}, 200, mina.linear);
			});
		},

		_prepareResetBtn: function() {
			var that = this;
			this._oResetBtn.touchend(function() {
				that._resetMap();
			});
		},
		
		_resetMap: function(){
			this._initParams();

			this._oMap.animate({
				transform: 't' + this._fCurrentX + ',' + this._fCurrentY + "s" + this._iZoomRatio
			}, 200, mina.linear);

			this._oInfoPopup.animate({
				opacity: 0
			}, 0, mina.easein, function() {
				this.attr({
					display: "none"
				});
			});
		},

		_enableDrag: function() {
			var that = this;
			var startX;
			var startY;

			this._oMap.touchstart(function(event) {
				startX = event.changedTouches[0].screenX;
				startY = event.changedTouches[0].screenY;
			});

			this._oMap.touchmove(function(event) {
				var curX = event.changedTouches[0].screenX;
				var curY = event.changedTouches[0].screenY;

				var offsetX = curX - startX;
				var offsetY = curY - startY;

				that._fCurrentX = offsetX + that._fOriginalX;
				that._fCurrentY = offsetY + that._fOriginalY;

				this.transform('t' + that._fCurrentX * 1.8 + ',' + that._fCurrentY * 1.58 + " s" + that._iZoomRatio);
			});

			this._oMap.touchend(function(event) {
				that._fOriginalX = that._fCurrentX;
				that._fOriginalY = that._fCurrentY;
			});
		},

		_calcPath: function() {
			var that = this;
			var oPath = _.find(this._aPathData, function(oPath) {
				return (oPath.location === that._sLocation) && (oPath.destination === that._sDestination);
			});

			this._oDestIcon.transform('t' + oPath.dest_coord);

			if (this._oLocIcon.attr("transform").string === "") {
				this._oLocIcon.transform('t' + oPath.loc_coord + "r" + this._fOrientation);
			} else {
				this._oLocIcon.animate({
					transform: 't' + oPath.loc_coord + "r" + this._fOrientation
				}, 200, mina.linear);
			}

			if (this._oSvg.select(".navi-path")) {
				this._oSvg.select(".navi-path").remove();
			}

			this._oNaviPath = this._oSvg.paper.polyline(oPath.path).attr({
				stroke: "orange",
				fill: "none",
				strokeWidth: 3,
				strokeDashoffset: 555.5,
				strokeDasharray: "20,10,5,5,5,10"
			// strokeDasharray: "20,10,20,10"
			}).addClass("navi-path");

			this._oNaviPath.animate({
				strokeDashoffset: 550
			}, 100, mina.linear, function() {
				that._animatePath();
			});

			this._oSvg.select(this._getId("navigator")).append(that._oNaviPath);
			
			if((!this._bIsThumbnail)&&(this._sLocation === "pantry")){
				this._showCoffeeIcon();
			}
			else{
				var oCoffeeInfo = this._oSvg.select(this._getId("coffeeinfo"));
				oCoffeeInfo.attr("display","none");
			}
		},

		_animatePath: function() {
			var that = this
			this._oNaviPath.animate({
				strokeDashoffset: 0
			}, 10000, mina.linear, function() {
				that._oNaviPath.attr({
					strokeDashoffset: 550
				});
				that._animatePath();
			});
		},

		_attachShowThumbnailEvt: function() {
			var that = this;
			this._oThumbnailBtn = this._oSvg.select(this._getId("thumbnail"));
			this._oThumbnailBtn.touchend(function() {
				that.fireEvent("showThumbnail");
			});
		},

		_attachShowFullsizeEvt: function() {
			var that = this;
			this._oThumbnailBtn = this._oSvg.select(this._getId("fullscreen"));
			this._oThumbnailBtn.touchend(function() {
				that.fireEvent("showFullsize");
			});
		},
		
		_showCoffeeIcon: function(){
			this._oSvg.select(this._getId("coffeeinfo")).attr("display","block");
			this._animateCoffeeIcon();
		},
		
		_animateCoffeeIcon: function(){
			var that = this;
			this._oCoffeeIcon.animate({
				transform: "s1.1,1.1" 
			}, 500, mina.linear, function(){
				that._oCoffeeIcon.animate({
					transform: "s0.9,0.9" 
				}, 500, mina.linear,function(){
					that._animateCoffeeIcon();
				});

			});
		},
		
		_attachCoffeeIconEvt: function(){
			var that = this;		
			this._oCoffeeIcon.touchend(function(){
				that._oInfoPopup.attr({
					display: "block"
				});
				that._oInfoPopup.animate({
					opacity: 1
				}, 500);
			});
		},
		
		_attachInfoPopupEvt: function(){
			var that = this;
			this._oInfoPopup.touchend(function() {
				this.animate({
					opacity: 0
				}, 500, mina.easein, function() {
					this.attr({
						display: "none"
					});
				});
			});
		},

		_getPathData: function() {
			var that = this;
			return $.getJSON("control/map/model/path.json", function(aPath) {
				that._aPathData = aPath;
			});
		},

		_getThumbnailData: function() {
			var that = this;
			return $.getJSON("control/map/model/thumbnail.json", function(aThumbnail) {
				that._aThumbnailData = aThumbnail;
			});
		},

		_adjustViewBox: function() {
			if (this._bIsThumbnail) {
				var that = this;
				var oThumbnail = _.find(this._aThumbnailData, function(oThumbnail) {
					return (oThumbnail.location === that._sLocation) && (oThumbnail.destination === that._sDestination);
				});
				var sViewBox = oThumbnail.x + "," + oThumbnail.y + "," + oThumbnail.width + "," + oThumbnail.height;
				this._oSvg.attr({
					viewBox: sViewBox
				});

				var oThumbToolbar = this._oSvg.select(this._getId("thumbnailtoolbar"));
				var fThumbToolbarX = parseFloat(oThumbnail.x) + parseFloat(oThumbnail.width) - 66 - 40;
				var fThumbToolbarY = parseFloat(oThumbnail.y) + 60;
				oThumbToolbar.transform("t" + fThumbToolbarX + "," + fThumbToolbarY);
			}
		},

		_hideFullScreenToolbar: function() {
			var oFullScrToolbar = this._oSvg.select(this._getId("fullscreentoolbar"));
			oFullScrToolbar.attr({
				display: "none"
			});
		},

		_hideThumbnailToolbar: function() {
			var oThumbToolbar = this._oSvg.select(this._getId("thumbnailtoolbar"));
			oThumbToolbar.attr({
				display: "none"
			});
		},

		_showResetBtn: function() {
			this._oResetBtn.attr("display", "block");
			this._oResetBtn.attr("transform", "t20,40");
			this._oResetBtn.animate({
				transform: "t20,140"
			}, 200, mina.linear);
		},

		_showFacilityBtn: function() {
			this._oFacilityBtn.attr("display", "block");
			this._oFacilityBtn.attr("transform", "t20,40");
			this._oFacilityBtn.animate({
				transform: "t20,240"
			}, 200, mina.linear);
		},

		_showZoomInBtn: function() {
			this._oZoomInBtn.attr("display", "block");
			this._oZoomInBtn.attr("transform", "t20,40");
			this._oZoomInBtn.animate({
				transform: "t20,240"
			}, 200, mina.linear);
		},

		_showZoomOutBtn: function() {
			this._oZoomOutBtn.attr("display", "block");
			this._oZoomOutBtn.attr("transform", "t20,40");
			this._oZoomOutBtn.animate({
				transform: "t20,309"
			}, 200, mina.linear);
		},

		_hideResetBtn: function() {
			var that = this;
			this._oResetBtn.animate({
				transform: "t20,40"
			}, 200, mina.linear, function() {
				that._oResetBtn.attr("display", "none");
			});
		},

		_hideFacilityBtn: function() {
			var that = this;
			this._oFacilityBtn.animate({
				transform: "t20,40"
			}, 200, mina.linear, function() {
				that._oFacilityBtn.attr("display", "none");
			});
		},

		_hideZoomInBtn: function() {
			var that = this;
			this._oZoomInBtn.animate({
				transform: "t20,40"
			}, 200, mina.linear, function() {
				that._oZoomInBtn.attr("display", "none");
			});
		},

		_hideZoomOutBtn: function() {
			var that = this;
			this._oZoomOutBtn.animate({
				transform: "t20,40"
			}, 200, mina.linear, function() {
				that._oZoomOutBtn.attr("display", "none");
			});
		},
		
		_highlightDestination: function(){
			this._oSvg.selectAll(".dest").forEach(function(oDest){
				oDest.removeClass("dest");
			});
			
			this._oSvg.selectAll(".dest-text").forEach(function(oDest){
				oDest.removeClass("dest-text");
			});
			
			var oDestination = this._oSvg.select(this._getId(this._sDestination));
			oDestination.select("polygon").addClass("dest");
			oDestination.selectAll("text").forEach(function(oText){
				oText.addClass("dest-text")
			});
		},
		
		_getId: function(sId) {
			return ("#" + this.getId() + "--" + sId);
		},

		renderer: function(oRm, oControl) {
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.addClass("map-container");
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("_VBox"));
			oRm.write("</div>");
		}
	});
});

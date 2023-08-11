var mapinfo = {
	regionsize: 512,
	chunksize: 16,
	tilesize: 128,
	maxzoom: 4
}

function InitMap() {
	// ===============================================================================================
	// 7dtd coordinate transformations

	SDTD_Projection = {
		project: function (latlng) {
			return new L.Point(
				(latlng.lat) / Math.pow(2, mapinfo.maxzoom),
				(latlng.lng) / Math.pow(2, mapinfo.maxzoom) );
		},
		
		unproject: function (point) {
			return new L.LatLng(
				point.x * Math.pow(2, mapinfo.maxzoom),
				point.y * Math.pow(2, mapinfo.maxzoom) );
		}
	};

	SDTD_CRS = L.extend({}, L.CRS.Simple, {
		projection: SDTD_Projection,
		transformation: new L.Transformation(1, 0, -1, 0),

		scale: function (zoom) {
			return Math.pow(2, zoom);
		}
	});

	// ===============================================================================================
	// Map and basic tile layers

	map = L.map('tab_map', {
		zoomControl: false, // Added by Zoomslider
		zoomsliderControl: true,
		attributionControl: false,
		crs: SDTD_CRS,
		// For the below options read section "Fractional zoom" here: https://leafletjs.com/examples/zoom-levels/
		zoomSnap: 1, // Defines the zoom levels that can be achieved at all
		zoomDelta: 1, // Defines how much the zoom is changed with keyboard +/- and the zoom slider control
		wheelPxPerZoomLevel: 60 // Defines how much mouse scrolling is needed per zoom level. If zoomDelta is e.g. 0.25 and you want the mouse scroll zoom to match that make this 4 times as high, i.e. 240
	}).setView([0, 0], Math.max(0, mapinfo.maxzoom - 5));


	var initTime = new Date().getTime();
	var tileLayer = GetSdtdTileLayer (mapinfo, initTime);
	var tileLayerMiniMap = GetSdtdTileLayer (mapinfo, initTime, true);

	// player icon
	var playerIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/marker-survivor.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/marker-survivor-2x.png',
	    iconSize: [25, 48],
	    iconAnchor: [12, 24],
	    popupAnchor: [0, -20]
	});
	
	// hostile icon
	var hostileIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/marker-zombie.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/marker-zombie-2x.png',
	    iconSize: [25, 33],
	    iconAnchor: [12, 16],
	    popupAnchor: [0, -10]
	});	
	
	// animal icon
	var animalIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/marker-animal.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/marker-animal-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	


	// ===============================================================================================
	// Overlays and controls

	var playersOnlineMarkerGroup = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});
	var playersOfflineMarkerGroup = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});
	var hostilesMarkerGroup = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});
	var animalsMarkerGroup = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});

	var densityMismatchMarkerGroupAir = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});
	var densityMismatchMarkerGroupTerrain = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});
	var densityMismatchMarkerGroupNonTerrain = L.markerClusterGroup({
		maxClusterRadius: function(zoom) { return zoom >= mapinfo.maxzoom ? 10 : 50; }
	});


	var layerControl = L.control.layers({
			//"Map": tileLayer
		}, null, {
			collapsed: false
		}
	);
	
	var layerCount = 0;


	tileLayer.addTo(map);

	new L.Control.Coordinates({}).addTo(map);
	
	new L.Control.ReloadTiles({
		autoreload_enable: true,
		autoreload_minInterval: 30,
		autoreload_interval: 120,
		autoreload_defaultOn: false,
		layers: [tileLayer, tileLayerMiniMap]
	}).addTo(map);
	
	layerControl.addOverlay (GetRegionLayer (mapinfo), "Region files");
	layerCount++;
	
	var miniMap = new L.Control.MiniMap(tileLayerMiniMap, {
		zoomLevelOffset: -6,
		toggleDisplay: true
	}).addTo(map);

	var measure = L.control.measure({
		units: {
			sdtdMeters: {
				factor: 0.00001,
				display: 'XMeters',
				decimals: 0
			},
			sdtdSqMeters: {
				factor: 0.000000001,
				display: 'XSqMeters',
				decimals: 0
			}
		},
		primaryLengthUnit: "sdtdMeters",
		primaryAreaUnit: "sdtdSqMeters",
		//activeColor: "#ABE67E",
		//completedColor: "#C8F2BE",
		position: "bottomleft"
	});
	//measure.addTo(map);

	new L.Control.GameTime({}).addTo(map);
	
	if (HasPermission ("webapi.getlandclaims")) {
		layerControl.addOverlay (GetLandClaimsLayer (map, mapinfo), "Land claims");
		layerCount++;
	}

	// CPM Checkboxes -->
	
	layerControl.addOverlay (GetResetRegionsLayer (map, mapinfo), "Reset Regions");
	layerCount++;

	layerControl.addOverlay (GetTraderMarkerLayer (map, mapinfo), "Traders");
	layerCount++;

	layerControl.addOverlay (GetAllPOILayer (map, mapinfo), "All POIs");
	layerCount++;

	layerControl.addOverlay (GetQuestPOILayer (map, mapinfo), "Quest POIs");
	layerCount++;

	if (HasPermission ("webapi.getlandclaims")) {
		layerControl.addOverlay (GetQuestPOIBedLcbLayer (map, mapinfo), "Quest POIs with bed/lcb");
		layerCount++;
	}

	if (HasPermission ("webapi.viewallclaims")) {
		layerControl.addOverlay (GetHomesLayer (map, mapinfo), "Player beds");
		layerCount++;
			
		layerControl.addOverlay (GetNormalClaimsLayer (map, mapinfo), "Adv. Claims Normal");
		layerCount++;
	
		layerControl.addOverlay (GetReversedClaimsLayer (map, mapinfo), "Adv. Claims Reversed");
		layerCount++;
	
		layerControl.addOverlay (GetTimedClaimsLayer (map, mapinfo), "Adv. Claims Timed");
		layerCount++;
	
		layerControl.addOverlay (GetLeveledClaimsLayer (map, mapinfo), "Adv. Claims Leveled");
		layerCount++;
	
		layerControl.addOverlay (GetPortalClaimsLayer (map, mapinfo), "Adv. Claims Portal");
		layerCount++;
	
		layerControl.addOverlay (GetHostilefreeClaimsLayer (map, mapinfo), "Adv. Claims Hostilefree");
		layerCount++;
	
		layerControl.addOverlay (GetOpenhoursClaimsLayer (map, mapinfo), "Adv. Claims Openhours");
		layerCount++;
	
		layerControl.addOverlay (GetNotifyClaimsLayer (map, mapinfo), "Adv. Claims Notify");
		layerCount++;
	
		layerControl.addOverlay (GetCommandClaimsLayer (map, mapinfo), "Adv. Claims Command");
		layerCount++;
			
		layerControl.addOverlay (GetPlayerlevelClaimsLayer (map, mapinfo), "Adv. Claims Playerlevel");
		layerCount++;
		
		layerControl.addOverlay (GetLcbFreeClaimsLayer (map, mapinfo), "Adv. Claims LcbFree");
		layerCount++;

		layerControl.addOverlay (GetAntiBlockClaimsLayer (map, mapinfo), "Adv. Claims AntiBlock");
		layerCount++;

		layerControl.addOverlay (GetResetClaimsLayer (map, mapinfo), "Adv. Claims Reset");
		layerCount++;

		layerControl.addOverlay (GetProBlockClaimsLayer (map, mapinfo), "Adv. Claims ProBlock");
		layerCount++;

		layerControl.addOverlay (GetLandclaimClaimsLayer (map, mapinfo), "Adv. Claims Landclaim");
		layerCount++;

		layerControl.addOverlay (GetVehicleMarkerLayer (map, mapinfo), "Vehicles");
		layerCount++;
	}
	
	// <-- CPM Checkboxes
	
	if (HasPermission ("webapi.gethostilelocation")) {
		layerControl.addOverlay (hostilesMarkerGroup, "Hostiles (<span id='mapControlHostileCount'>0</span>)");
		layerCount++;
	}
	
	if (HasPermission ("webapi.getanimalslocation")) {
		layerControl.addOverlay (animalsMarkerGroup, "Animals (<span id='mapControlAnimalsCount'>0</span>)");
		layerCount++;
	}
	
	if (HasPermission ("webapi.getplayerslocation")) {
		layerControl.addOverlay (playersOfflineMarkerGroup, "Players (offline) (<span id='mapControlOfflineCount'>0</span>)");
		layerControl.addOverlay (playersOnlineMarkerGroup, "Players (online) (<span id='mapControlOnlineCount'>0</span>)");
		layerCount++;
	}
	
	if (layerCount > 0) {
		layerControl.addTo(map);
	}




	var hostilesMappingList = {};
	var animalsMappingList = {};
	var playersMappingList = {};

	

	// ===============================================================================================
	// Player markers

	$(".leaflet-popup-pane").on('click.action', '.inventoryButton', function(event) {
		ShowInventoryDialog ($(this).data('steamid'));
	});

	var updatingMarkers = false;


	var setPlayerMarkers = function(data) {
		var onlineIds = [];
		updatingMarkers = true;
		$.each( data, function( key, val ) {
			var marker;
			if (playersMappingList.hasOwnProperty(val.steamid)) {
				marker = playersMappingList[val.steamid].currentPosMarker;
			} else {
				marker = L.marker([val.position.x, val.position.z], {icon: playerIcon}).bindPopup(
					"Player: " + $("<div>").text(val.name).html() +
					(HasPermission ("webapi.getplayerinventory") ?
						"<br/><a class='inventoryButton' data-steamid='"+val.steamid+"'>Show inventory</a>"
						: "")
				);
				marker.on("move", function ( e ) {
					if ( this.isPopupOpen () ) {
						map.flyTo (e.latlng, map.getZoom ());
					}
				});
				playersMappingList[val.steamid] = { online: !val.online };
			}
			
			if (val.online) {
				onlineIds.push (val.steamid);
			}
			
			oldpos = marker.getLatLng ();
			if ( playersMappingList[val.steamid].online != val.online ) {
				if (playersMappingList[val.steamid].online) {
					playersOnlineMarkerGroup.removeLayer(marker);
					playersOfflineMarkerGroup.addLayer(marker);
				} else {
					playersOfflineMarkerGroup.removeLayer(marker);
					playersOnlineMarkerGroup.addLayer(marker);
				}
			}
			if ( oldpos.lat != val.position.x || oldpos.lng != val.position.z ) {
				marker.setLatLng([val.position.x, val.position.z]);
				if (val.online) {
						marker.setOpacity(1.0);
				} else {
						marker.setOpacity(0.5);
				}
			}

			val.currentPosMarker = marker;
			playersMappingList[val.steamid] = val;
		});
		
		var online = 0;
		var offline = 0;
		$.each ( playersMappingList, function ( key, val ) {
			if ( val.online && onlineIds.indexOf (key) < 0 ) {
				var marker = val.currentPosMarker;
				playersOnlineMarkerGroup.removeLayer(marker);
				playersOfflineMarkerGroup.addLayer(marker);
				val.online = false;
			}
			if (val.online) {
				online++;
			} else {
				offline++;
			}
		});
		
		updatingMarkers = false;

		$( "#mapControlOnlineCount" ).text( online );
		$( "#mapControlOfflineCount" ).text( offline );
	}

	var updatePlayerTimeout;
	var playerUpdateCount = -1;
	var updatePlayerEvent = function() {
		playerUpdateCount++;
		
		$.getJSON( "../api/getplayerslocation" + ((playerUpdateCount % 15) == 0 ? "?offline=true" : ""))
		.done(setPlayerMarkers)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching players list");
		})
		.always(function() {
			updatePlayerTimeout = window.setTimeout(updatePlayerEvent, 4000);
		});
	}

	tabs.on ("tabbedcontenttabopened", function (event, data) {
		if (data.newTab === "#tab_map") {
			if (HasPermission ("webapi.getplayerslocation")) {
				updatePlayerEvent ();
			}
		} else {
			window.clearTimeout (updatePlayerTimeout);
		}
	});
	
	if (tabs.tabbedContent ("isTabOpen", "tab_map")) {
		if (HasPermission ("webapi.getplayerslocation")) {
			updatePlayerEvent ();
		}
	}




	// ===============================================================================================
	// Hostiles markers

	var setHostileMarkers = function(data) {
		updatingMarkersHostile = true;
		
		var hostileCount = 0;

		hostilesMarkerGroup.clearLayers();
		
		$.each( data, function( key, val ) {
			var marker;
			if (hostilesMappingList.hasOwnProperty(val.id)) {
				marker = hostilesMappingList[val.id].currentPosMarker;
			} else {
				marker = L.marker([val.position.x, val.position.z], {icon: hostileIcon}).bindPopup(
					"Hostile: " + val.name
				);
				//hostilesMappingList[val.id] = { };
				hostilesMarkerGroup.addLayer(marker);
			}

			var bAbort = false;
			
			oldpos = marker.getLatLng ();

			//if ( oldpos.lat != val.position.x || oldpos.lng != val.position.z ) {
			//	hostilesMarkerGroup.removeLayer(marker);
				marker.setLatLng([val.position.x, val.position.z]);
				marker.setOpacity(1.0);
				hostilesMarkerGroup.addLayer(marker);
			//}

			val.currentPosMarker = marker;
			hostilesMappingList[val.id] = val;
			
			hostileCount++;
		});
		
		$( "#mapControlHostileCount" ).text( hostileCount );
		
		updatingMarkersHostile = false;
	}

	var updateHostileTimeout;
	var updateHostileEvent = function() {
		$.getJSON( "../api/gethostilelocation")
		.done(setHostileMarkers)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching hostile list");
		})
		.always(function() {
			updateHostileTimeout = window.setTimeout(updateHostileEvent, 4000);
		});
	}

	tabs.on ("tabbedcontenttabopened", function (event, data) {
		if (data.newTab === "#tab_map") {
			if (HasPermission ("webapi.gethostilelocation")) {
				updateHostileEvent ();
			}
		} else {
			window.clearTimeout (updateHostileTimeout);
		}
	});
	
	if (tabs.tabbedContent ("isTabOpen", "tab_map")) {
		if (HasPermission ("webapi.gethostilelocation")) {
			updateHostileEvent ();
		}
	}



	// ===============================================================================================
	// Animals markers

	var setAnimalMarkers = function(data) {
		updatingMarkersAnimals = true;
		
		var animalsCount = 0;

		animalsMarkerGroup.clearLayers();
		
		$.each( data, function( key, val ) {
			var marker;
			if (animalsMappingList.hasOwnProperty(val.id)) {
				marker = animalsMappingList[val.id].currentPosMarker;
			} else {
				marker = L.marker([val.position.x, val.position.z], {icon: animalIcon}).bindPopup(
					"Animal: " + val.name
				);
				//animalsMappingList[val.id] = { };
				animalsMarkerGroup.addLayer(marker);
			}

			var bAbort = false;
			
			oldpos = marker.getLatLng ();

			//if ( oldpos.lat != val.position.x || oldpos.lng != val.position.z ) {
			//	animalsMarkerGroup.removeLayer(marker);
				marker.setLatLng([val.position.x, val.position.z]);
				marker.setOpacity(1.0);
				animalsMarkerGroup.addLayer(marker);
			//}

			val.currentPosMarker = marker;
			animalsMappingList[val.id] = val;
			
			animalsCount++;
		});
		
		$( "#mapControlAnimalsCount" ).text( animalsCount );
		
		updatingMarkersAnimals = false;
	}

	var updateAnimalsTimeout;
	var updateAnimalsEvent = function() {
		$.getJSON( "../api/getanimalslocation")
		.done(setAnimalMarkers)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching animals list");
		})
		.always(function() {
			updateAnimalsTimeout = window.setTimeout(updateAnimalsEvent, 4000);
		});
	}

	tabs.on ("tabbedcontenttabopened", function (event, data) {
		if (data.newTab === "#tab_map") {
			if (HasPermission ("webapi.getanimalslocation")) {
				updateAnimalsEvent ();
			}
		} else {
			window.clearTimeout (updateAnimalsTimeout);
		}
	});
	
	if (tabs.tabbedContent ("isTabOpen", "tab_map")) {
		if (HasPermission ("webapi.getanimalslocation")) {
			updateAnimalsEvent ();
		}
	}

	
	
	
	
	
	
	
	
	// ===============================================================================================
	// Density markers

	var setDensityMarkers = function(data) {
		var densityCountAir = 0;
		var densityCountTerrain = 0;
		var densityCountNonTerrain = 0;

		densityMismatchMarkerGroupAir.clearLayers();
		densityMismatchMarkerGroupTerrain.clearLayers();
		densityMismatchMarkerGroupNonTerrain.clearLayers();
		
		
		var downloadCsv = true;
		var downloadJson = false;
		
		if (downloadJson) {
			var jsonAir = [];
			var jsonTerrain = [];
			var jsonNonTerrain = [];
		}
		if (downloadCsv) {
			var csvAir = "x;y;z;Density;IsTerrain;BvType\r\n";
			var csvTerrain = "x;y;z;Density;IsTerrain;BvType\r\n";
			var csvNonTerrain = "x;y;z;Density;IsTerrain;BvType\r\n";
		}
		
		$.each( data, function( key, val ) {
			if (val.bvtype == 0) {
				marker = L.marker([val.x, val.z]).bindPopup(
					"Density Mismatch: <br>Position: " + val.x + " " + val.y + " " + val.z + "<br>Density: " + val.density + "<br>isTerrain: " + val.terrain + "<br>bv.type: " + val.bvtype
				);
				densityMismatchMarkerGroupAir.addLayer(marker);
				densityCountAir++;
				if (downloadJson) {
					jsonAir.push (val);
				}
				if (downloadCsv) {
					csvAir += val.x + ";" + val.y + ";" + val.z + ";" + val.density + ";" + val.terrain + ";" + val.bvtype + "\r\n";
				}
			} else if (val.terrain) {
				marker = L.marker([val.x, val.z]).bindPopup(
					"Density Mismatch: <br>Position: " + val.x + " " + val.y + " " + val.z + "<br>Density: " + val.density + "<br>isTerrain: " + val.terrain + "<br>bv.type: " + val.bvtype
				);
				densityMismatchMarkerGroupTerrain.addLayer(marker);
				densityCountTerrain++;
				if (downloadJson) {
					jsonTerrain.push (val);
				}
				if (downloadCsv) {
					csvTerrain += val.x + ";" + val.y + ";" + val.z + ";" + val.density + ";" + val.terrain + ";" + val.bvtype + "\r\n";
				}
			} else {
				marker = L.marker([val.x, val.z]).bindPopup(
					"Density Mismatch: <br>Position: " + val.x + " " + val.y + " " + val.z + "<br>Density: " + val.density + "<br>isTerrain: " + val.terrain + "<br>bv.type: " + val.bvtype
				);
				densityMismatchMarkerGroupNonTerrain.addLayer(marker);
				densityCountNonTerrain++;
				if (downloadJson) {
					jsonNonTerrain.push (val);
				}
				if (downloadCsv) {
					csvNonTerrain += val.x + ";" + val.y + ";" + val.z + ";" + val.density + ";" + val.terrain + ";" + val.bvtype + "\r\n";
				}
			}
		});

		layerControl.addOverlay (densityMismatchMarkerGroupAir, "Density Mismatches Air (<span id='mapControlDensityCountAir'>0</span>)");
		layerControl.addOverlay (densityMismatchMarkerGroupTerrain, "Density Mismatches Terrain (<span id='mapControlDensityCountTerrain'>0</span>)");
		layerControl.addOverlay (densityMismatchMarkerGroupNonTerrain, "Density Mismatches NonTerrain (<span id='mapControlDensityCountNonTerrain'>0</span>)");

		$( "#mapControlDensityCountAir" ).text( densityCountAir );
		$( "#mapControlDensityCountTerrain" ).text( densityCountTerrain );
		$( "#mapControlDensityCountNonTerrain" ).text( densityCountNonTerrain );
		
		if (downloadJson) {
			download ("air-negative-density.json", JSON.stringify(jsonAir, null, '\t'));
			download ("terrain-positive-density.json", JSON.stringify(jsonTerrain, null, '\t'));
			download ("nonterrain-negative-density.json", JSON.stringify(jsonNonTerrain, null, '\t'));
		}
		if (downloadCsv) {
			download ("air-negative-density.csv", csvAir);
			download ("terrain-positive-density.csv", csvTerrain);
			download ("nonterrain-negative-density.csv", csvNonTerrain);
		}
		
		function download(filename, text) {
			var element = document.createElement('a');
			var file = new Blob([text], {type: 'text/plain'});
			element.href = URL.createObjectURL(file);
			element.download = filename;

			element.style.display = 'none';
			document.body.appendChild(element);

			element.click();

			document.body.removeChild(element);
		}
	}

	$.getJSON("densitymismatch.json")
	.done(setDensityMarkers)
	.fail(function(jqxhr, textStatus, error) {
		console.log("Error fetching density mismatch list");
	});

}





function StartMapModule () {
	$.getJSON( "../map/mapinfo.json")
	.done(function(data) {
		mapinfo.tilesize = data.blockSize;
		mapinfo.maxzoom = data.maxZoom;
	})
	.fail(function(jqxhr, textStatus, error) {
		console.log ("Error fetching map information");
	})
	.always(function() {
		InitMap ();
	});
}

//CPM Layers -->

function GetResetRegionsLayer (map, mapinfo) {
	var resetRegionColor = "#FF0000" //put any html color code in here to make the polygon suit your color needs
	var resetRegionTooltip = "This region is marked for reset. Do NOT build here!" //text that will be shown in tooltip if polygon is clicked
	
	var resetRegionsGroup = L.layerGroup();
	
	var setResetRegions = function(data) {
		resetRegionsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: resetRegionColor,color: resetRegionColor,fillOpacity:0.15});
			polygon.bindPopup(resetRegionTooltip);
			resetRegionsGroup.addLayer(polygon);
		});
	}
	
  	var updateResetRegionsEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getresetregions")
		.done(setResetRegions)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching reset regions claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == resetRegionsGroup) {
			updateResetRegionsEvent();
		}
	});

	return resetRegionsGroup;
}

function GetTraderMarkerLayer (map, mapinfo) {
	var traderMarkerGroup = L.layerGroup();
	
	var traderIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10],
		correction: [20, 18]
	});
	
	var setTraderMarkers = function(data) {
		traderMarkerGroup.clearLayers();
		
		$.each( data.Traders, function( key, val ) {
			var marker;
			var traderTooltip = "Trader: " + val.name;
			marker = L.marker([val.x, val.z], {icon: traderIcon});
			marker.bindPopup(traderTooltip);
			traderMarkerGroup.addLayer(marker);
		});		
	}
	
	var updateTraderMarkerEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/gettraders")
		.done(setTraderMarkers)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching traders");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == traderMarkerGroup) {
			updateTraderMarkerEvent();
		}
	});

	return traderMarkerGroup;
}

function GetAllPOILayer (map, mapinfo) {
	var allPOIcolor = "#EBF551"; //put any html color code in here to make the polygon suit your color needs

	var allPoiGroup = L.layerGroup();
	
	var setallpois = function(data) {
		allPoiGroup.clearLayers();
		
		$.each( data.AllPOIs, function( key, val ) {
			var sizex = Math.abs(val.minx - val.maxx);
			var sizez = Math.abs(val.minz - val.maxz);
			var sizeHalfx = Math.floor(sizex / 2);
			var sizeHalfz = Math.floor(sizez / 2);
			var bounds = L.latLngBounds(L.latLng(val.x - sizeHalfx, val.z - sizeHalfz), L.latLng(val.x + sizeHalfx, val.z + sizeHalfz));
			var r = L.rectangle(bounds, {color: allPOIcolor, weight: 1, opacity: 0.8, fillOpacity: 0.15});
			r.bindPopup("Name: " + val.name + " <br/>Position: " + val.x + " " + val.z + " <br/>Conttains bed/lcb: " + val.containsbed);
			allPoiGroup.addLayer(r);
		});
	}

	var updateAllPoiEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
		$.getJSON( "http://" + hostname + ":" + port + "/api/getallpois")
		.done(setallpois)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching all pois");
		})
	}	

	map.on('overlayadd', function(e) {
		if (e.layer == allPoiGroup) {
			updateAllPoiEvent();
		}
	});

	return allPoiGroup;
}

function GetQuestPOILayer (map, mapinfo) {
	var questPOIcolor = "#ff0000"; //put any html color code in here to make the polygon suit your color needs

	var questPoiGroup = L.layerGroup();
	
	var setquestpois = function(data) {
		questPoiGroup.clearLayers();
		
		$.each( data.QuestPOIs, function( key, val ) {
			var sizex = Math.abs(val.minx - val.maxx);
			var sizez = Math.abs(val.minz - val.maxz);
			var sizeHalfx = Math.floor(sizex / 2);
			var sizeHalfz = Math.floor(sizez / 2);
			var bounds = L.latLngBounds(L.latLng(val.x - sizeHalfx, val.z - sizeHalfz), L.latLng(val.x + sizeHalfx, val.z + sizeHalfz));
			var r = L.rectangle(bounds, {color: questPOIcolor, weight: 1, opacity: 0.8, fillOpacity: 0.15});
			r.bindPopup("Name: " + val.name + " <br/>Position: " + val.x + " " + val.z + " <br/>Conttains bed/lcb: " + val.containsbed);
			questPoiGroup.addLayer(r);
		});
	}

	var updateQuestPoiEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
		$.getJSON( "http://" + hostname + ":" + port + "/api/getquestpois")
		.done(setquestpois)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching quest pois");
		})
	}	

	map.on('overlayadd', function(e) {
		if (e.layer == questPoiGroup) {
			updateQuestPoiEvent();
		}
	});

	return questPoiGroup;
}

function GetQuestPOIBedLcbLayer (map, mapinfo) {
	var questPOIBedLcbColor = "#F8160F"; //put any html color code in here to make the polygon suit your color needs
	
	var questPoiGroup = L.layerGroup();
	
	var questPoiIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10],
		correction: [20, 18]
	});

	var setquestpois = function(data) {
		questPoiGroup.clearLayers();
		
		$.each( data.QuestPOIs, function( key, val ) {
			var marker;
			var sizex = Math.abs(val.minx - val.maxx);
			var sizez = Math.abs(val.minz - val.maxz);
			var sizeHalfx = Math.floor(sizex / 2);
			var sizeHalfz = Math.floor(sizez / 2);
			var bounds = L.latLngBounds(L.latLng(val.x - sizeHalfx, val.z - sizeHalfz), L.latLng(val.x + sizeHalfx, val.z + sizeHalfz));
			var r = L.rectangle(bounds, {color: questPOIBedLcbColor, weight: 1, opacity: 0.8, fillOpacity: 0.15});
			r.bindPopup("Name: " + val.name + " <br/>Position: " + val.x + " " + val.z + " <br/>Conttains bed/lcb: " + val.containsbed);
			marker = L.marker([val.x, val.z], {icon: questPoiIcon});
			marker.bindPopup("Name: " + val.name + " <br/>Position: " + val.x + " " + val.z + " <br/>Conttains bed/lcb: " + val.containsbed);
			questPoiGroup.addLayer(marker);
			questPoiGroup.addLayer(r);
		});
	}

	var updateQuestPoiEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
		$.getJSON( "http://" + hostname + ":" + port + "/api/getquestpois?filter=bedlcbonly")
		.done(setquestpois)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching quest pois");
		})
	}	

	map.on('overlayadd', function(e) {
		if (e.layer == questPoiGroup) {
			updateQuestPoiEvent();
		}
	});

	return questPoiGroup;
}

function GetNormalClaimsLayer (map, mapinfo) {
	var normalColor = "#00FF00"; 
	var normalClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setNormal = function(data) {
		normalClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: normalColor,color: normalColor,fillOpacity:0.15});
			
			var normalTooltip = "Name: " + value.Name + " Type: Normal";
			//polygon.bindPopup(normalTooltip);
			
			normalClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(normalTooltip);
			normalClaimsGroup.addLayer(marker);
		});
		
	}

	var updateNormalEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=normal")
		.done(setNormal)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching normal claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == normalClaimsGroup) {
			updateNormalEvent();
		}
	});

	return normalClaimsGroup;
}

function GetReversedClaimsLayer (map, mapinfo) {
	var reversedColor = "#FF4000";
	var reversedClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setReversed = function(data) {
		reversedClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: reversedColor,color: reversedColor,fillOpacity:0.15});
			
			var reversedTooltip = "Name: " + value.Name + " Type: Reversed";
			//polygon.bindPopup(reversedTooltip);
			
			reversedClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(reversedTooltip);
			reversedClaimsGroup.addLayer(marker);
		});
		
	}

	var updateReversedEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=reversed")
		.done(setReversed)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching reversed claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == reversedClaimsGroup) {
			updateReversedEvent();
		}
	});

	return reversedClaimsGroup;
}

function GetHostilefreeClaimsLayer (map, mapinfo) {
	var hostilefreeColor = "#00FFFF";
	var hostilefreeClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setHostilefree = function(data) {
		hostilefreeClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: hostilefreeColor,color: hostilefreeColor,fillOpacity:0.15});
			
			var hostilefreeTooltip = "Name: " + value.Name + " Type: Hostilefree";
			//polygon.bindPopup(hostilefreeTooltip);
			
			hostilefreeClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(hostilefreeTooltip);
			hostilefreeClaimsGroup.addLayer(marker);
		});
		
	}

	var updateHostilefreeEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=hostilefree")
		.done(setHostilefree)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching hostilefree claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == hostilefreeClaimsGroup) {
			updateHostilefreeEvent();
		}
	});

	return hostilefreeClaimsGroup;
}

function GetTimedClaimsLayer (map, mapinfo) {
	var timedColor = "#00FF00";
	var timedClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setTimed = function(data) {
		timedClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: timedColor,color: timedColor,fillOpacity:0.15});
			
			var timedTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(timedTooltip);
			
			timedClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(timedTooltip);
			timedClaimsGroup.addLayer(marker);
		});
		
	}

	var updateTimedEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=timed")
		.done(setTimed)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching timed claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == timedClaimsGroup) {
			updateTimedEvent();
		}
	});

	return timedClaimsGroup;
}

function GetLeveledClaimsLayer (map, mapinfo) {
	var leveledColor = "#00FF00";
	var leveledClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setLeveled = function(data) {
		leveledClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: leveledColor,color: leveledColor,fillOpacity:0.15});
			
			var leveledTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(leveledTooltip);
			
			leveledClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(leveledTooltip);
			leveledClaimsGroup.addLayer(marker);
		});
		
	}

	var updateLeveledEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=leveled")
		.done(setLeveled)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching leveled claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == leveledClaimsGroup) {
			updateLeveledEvent();
		}
	});

	return leveledClaimsGroup;
}

function GetPortalClaimsLayer (map, mapinfo) {
	var portalColor = "#A901DB";
	var portalClaimsGroup = L.layerGroup();
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setPortal = function(data) {
		portalClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: portalColor,color: portalColor,fillOpacity:0.15});
			
			var portalTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(portalTooltip);
			
			portalClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(portalTooltip);
			portalClaimsGroup.addLayer(marker);
		});
		
	}

	var updatePortalEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=portal")
		.done(setPortal)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching portal claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == portalClaimsGroup) {
			updatePortalEvent();
		}
	});

	return portalClaimsGroup;
}

function GetOpenhoursClaimsLayer (map, mapinfo) {
	var openhoursColor = "#00FF00";
	var openhoursClaimsGroup = L.layerGroup();
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setOpenhours = function(data) {
		openhoursClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: openhoursColor,color: openhoursColor,fillOpacity:0.15});
			
			var openhoursTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(openhoursTooltip);
			
			openhoursClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(openhoursTooltip);
			openhoursClaimsGroup.addLayer(marker);
		});
		
	}

	var updateOpenhoursEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=openhours")
		.done(setOpenhours)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching openhours claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == openhoursClaimsGroup) {
			updateOpenhoursEvent();
		}
	});

	return openhoursClaimsGroup;
}

function GetNotifyClaimsLayer (map, mapinfo) {
	var notifyColor = "#FF0000";
	var notifyClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setNotify = function(data) {
		notifyClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: notifyColor,color: notifyColor,fillOpacity:0.15});
			
			var notifyTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(notifyTooltip);
			
			notifyClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(notifyTooltip);
			notifyClaimsGroup.addLayer(marker);
		});
		
	}

	var updateNotifyEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=notify")
		.done(setNotify)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching notify claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == notifyClaimsGroup) {
			updateNotifyEvent();
		}
	});

	return notifyClaimsGroup;
}

function GetCommandClaimsLayer (map, mapinfo) {
	var commandColor = "#0000FF";
	var commandClaimsGroup = L.layerGroup();
		
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setCommand = function(data) {
		commandClaimsGroup.clearLayers();
							
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: commandColor,color: commandColor,fillOpacity:0.15});
			
			var commandTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(commandTooltip);
			
			commandClaimsGroup.addLayer(polygon);
						
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(commandTooltip);
			commandClaimsGroup.addLayer(marker);
		});
		
	}

	var updateCommandEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=command")
		.done(setCommand)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching command claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == commandClaimsGroup) {
			updateCommandEvent();
		}
	});

	return commandClaimsGroup;
}

function GetPlayerlevelClaimsLayer (map, mapinfo) {
	var playerlevelColor = "#BF00FF";
	var playerlevelClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setPlayerlevel = function(data) {
		playerlevelClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: playerlevelColor,color: playerlevelColor,fillOpacity:0.15});
			
			var playerlevelTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			playerlevelClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(playerlevelTooltip);
			playerlevelClaimsGroup.addLayer(marker);
		});
		
	}

	var updatePlayerlevelEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=playerlevel")
		.done(setPlayerlevel)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching playerlevel claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == playerlevelClaimsGroup) {
			updatePlayerlevelEvent();
		}
	});

	return playerlevelClaimsGroup;
}

function GetLcbFreeClaimsLayer (map, mapinfo) {
	var lcbfreeColor = "#00FF00";
	var lcbfreeClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setLcbFree = function(data) {
		lcbfreeClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: lcbfreeColor,color: lcbfreeColor,fillOpacity:0.15});
			
			var lcbFreeTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			lcbfreeClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(lcbFreeTooltip);
			lcbfreeClaimsGroup.addLayer(marker);
		});
		
	}

	var updateLcbFreeEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=lcbfree")
		.done(setLcbFree)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching lcbfree claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == lcbfreeClaimsGroup) {
			updateLcbFreeEvent();
		}
	});

	return lcbfreeClaimsGroup;
}

function GetHomesLayer (map, mapinfo) {
	var homesGroup = L.layerGroup();
	var homesClusterGroup = L.markerClusterGroup({
		disableClusteringAtZoom: mapinfo.maxzoom,
		singleMarkerMode: true,
		maxClusterRadius: 50
	});
	var homesRectGroup = L.layerGroup();
	homesGroup.addLayer(homesClusterGroup);
	homesGroup.addLayer(homesRectGroup);
	var maxZoomForCluster = -1;


	var sethomes = function(data) {
		homesClusterGroup.clearLayers();
		homesRectGroup.clearLayers();
	
		var homePower = Math.floor(Math.log(data.homesize) / Math.LN2);
		var maxClusterZoomUnlimited = mapinfo.maxzoom - (homePower - 3);
		var maxClusterZoomLimitedMax = Math.min(maxClusterZoomUnlimited, mapinfo.maxzoom+1);
		maxZoomForCluster = Math.max(maxClusterZoomLimitedMax, 0);
	
		checkHomeClustering({target: map});

		var size = data.homesize;
		
		$.each( data.homeowners, function( key, val ) {
			var steamid = val.steamid;
			
			var color = val.active ? "#55ff55" : "#ff0000";
				
			var pos = L.latLng(val.x, val.z);
			var bounds = L.latLngBounds(L.latLng(val.x - size, val.z - size), L.latLng(val.x + size, val.z + size));
			var r = L.rectangle(bounds, {color: color, weight: 1, opacity: 0.8, fillOpacity: 0.15});
			var m = L.marker(pos, { clickable: false, keyboard: false, zIndexOffset:-1000, iconSize: [0,0], icon: L.divIcon({className: 'invisIcon', iconSize:[0,0]}) });
			r.bindPopup("Owner: " + steamid + " <br/>Position: " + val.x + " " + val.y + " " + val.z + " <br/>Active: " + val.active);
			homesRectGroup.addLayer(r);
			homesClusterGroup.addLayer(m);
			
		});
	}

	var updateHomesEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
		$.getJSON( "http://" + hostname + ":" + port + "/api/getplayerhomes")
		.done(sethomes)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching player homes");
		})
	}


	var checkHomeClustering = function(e) {
		if (e.target._zoom >= maxZoomForCluster) {
			homesGroup.removeLayer(homesClusterGroup);	
		} else {
			homesGroup.addLayer(homesClusterGroup);	
		}
	};

	map.on('zoomend', checkHomeClustering);
	
	map.on('overlayadd', function(e) {
		if (e.layer == homesGroup) {
			updateHomesEvent();
		}
	});

	return homesGroup;
}

function GetAntiBlockClaimsLayer (map, mapinfo) {
	var antiblockColor = "#00FF00";
	var antiblockClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setAntiBlock = function(data) {
		antiblockClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: antiblockColor,color: antiblockColor,fillOpacity:0.15});
			
			var antiBlockTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			antiblockClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(antiBlockTooltip);
			antiblockClaimsGroup.addLayer(marker);
		});
		
	}

	var updateAntiBlockEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=antiblock")
		.done(setAntiBlock)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching antiblock claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == antiblockClaimsGroup) {
			updateAntiBlockEvent();
		}
	});

	return antiblockClaimsGroup;
}

function GetResetClaimsLayer (map, mapinfo) {
	var resetColor = "#00FF00";
	var resetClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setReset = function(data) {
		resetClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: resetColor,color: resetColor,fillOpacity:0.15});
			
			var resetTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			resetClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(resetTooltip);
			resetClaimsGroup.addLayer(marker);
		});
		
	}

	var updateResetEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=reset")
		.done(setReset)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching reset claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == resetClaimsGroup) {
			updateResetEvent();
		}
	});

	return resetClaimsGroup;
}

function GetProBlockClaimsLayer (map, mapinfo) {
	var problockColor = "#00FF00";
	var problockClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setProBlock = function(data) {
		problockClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: problockColor,color: problockColor,fillOpacity:0.15});
			
			var proBlockTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			problockClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(proBlockTooltip);
			problockClaimsGroup.addLayer(marker);
		});
		
	}

	var updateProBlockEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=problock")
		.done(setProBlock)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching problock claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == problockClaimsGroup) {
			updateProBlockEvent();
		}
	});

	return problockClaimsGroup;
}

function GetLandclaimClaimsLayer (map, mapinfo) {
	var landclaimColor = "#00FF00";
	var landclaimClaimsGroup = L.layerGroup();
	
	// adv. Claim icon
	var advClaimIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers-2x.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10]
	});
	
	var marker;
	
	var setLandclaim = function(data) {
		landclaimClaimsGroup.clearLayers();
					
		$.each(data, function (index, value) {	//console.log(value);
				
			var polygon = L.polygon([
			[value.E,value.S],
			[value.W,value.S],
			[value.W,value.N],
			[value.E,value.N]
			]);
			polygon.setStyle({weight:1,fillColor: landclaimColor,color: landclaimColor,fillOpacity:0.15});
			
			var landclaimTooltip = "Name: " + value.Name + " Type: " + value.Type;
			//polygon.bindPopup(playerlevelTooltip);
			
			landclaimClaimsGroup.addLayer(polygon);
			
			marker = L.marker([value.W, value.N], {icon: advClaimIcon});
			marker.bindPopup(landclaimTooltip);
			landclaimClaimsGroup.addLayer(marker);
		});
		
	}

	var updateLandclaimEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getadvclaims?type=landclaim")
		.done(setLandclaim)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching landclaim claim list");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == landclaimClaimsGroup) {
			updateLandclaimEvent();
		}
	});

	return landclaimClaimsGroup;
}

function GetVehicleMarkerLayer (map, mapinfo) {
	var vehicleMarkerGroup = L.layerGroup();
	
	var vehicleIcon = L.icon({
	    iconUrl: '/legacymap/leaflet/images/layers.png',
	    iconRetinaUrl: '/legacymap/leaflet/images/layers.png',
	    iconSize: [25, 26],
	    iconAnchor: [12, 13],
	    popupAnchor: [0, -10],
		correction: [20, 18]
	});
	
	var setVehicleMarkers = function(data) {
		vehicleMarkerGroup.clearLayers();
		
		$.each( data.Vehicles, function( key, val ) {
			var marker;
			var vehicleTooltip = "Vehicle: " + val.name + " (x:" + val.posX + ", y:" + val.posY + ", z:" + val.posZ + ")"; 
			marker = L.marker([val.posX, val.posZ], {icon: vehicleIcon});
			marker.bindPopup(vehicleTooltip);
			vehicleMarkerGroup.addLayer(marker);
		});		
	}
	
	var updateVehicleMarkerEvent = function() {
		var port = location.port;
		port = +port + 3;
		var hostname = location.hostname;
				
		$.getJSON("http://" + hostname + ":" + port + "/api/getvehicles")
		.done(setVehicleMarkers)
		.fail(function(jqxhr, textStatus, error) {
			console.log("Error fetching vehicles");
		})
	}
		
	map.on('overlayadd', function(e) {
		if (e.layer == vehicleMarkerGroup) {
			updateVehicleMarkerEvent();
		}
	});

	return vehicleMarkerGroup;
}

// <--CPM Layers

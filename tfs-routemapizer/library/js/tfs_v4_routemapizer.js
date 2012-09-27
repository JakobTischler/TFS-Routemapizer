/**
 * Javascript: Scripts
 * 
 * Rapid Javascript development.
 * 
 * @package WP Framework
 * @subpackage JS
 */

var $j = jQuery.noConflict();

;(function($j){
				$j(document).ready(function(){ 
				
					function initialize(routesStr) {
						var latlng = new google.maps.LatLng(25, 0);
						var myOptions = {
							zoom: 3,
							center: latlng,
							mapTypeId: google.maps.MapTypeId.TERRAIN,
							overviewMapControl: true,
							streetViewControl: false,
							mapTypeControl: true,
							mapTypeControlOptions: {
								style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
							}
						};
						map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
						
						
						$j('#map_canvas').append('<div id="tfs_heading">TFS Routemapizer</div>');
						$j('#tfs_heading')
							.addClass('sans-serif')
							.append('<span class="fullscreen">Go all the way</span><span class="closefullscreen">Close</span>');
						
						CanvasWidthOrig = $j('#map_canvas').width();
						CanvasHeightOrig = $j('#map_canvas').height();
						$j('.fullscreen').on('click', function() {
							$j('#map_canvas')
								.css({
									position: 'fixed',
									height:'100%', 
									left:0, 
									top:0, 
									width:'100%'
								})
								.animate({
									width:'100%' //bogus animation, only so we can call a callback
								}, function() {
									google.maps.event.trigger(map, 'resize');
									map.fitBounds(bounds);
								});
							$j(this).hide(); $j('#header, .section_divider, .hfeed h1, .routesData').hide();
							$j('.closefullscreen').show();
							return false;
						});
							
						$j('.closefullscreen').on('click', function() {
							$j('#map_canvas')
								.css({
									position: 'relative',
									height: CanvasHeightOrig + 'px'
								})
								.animate({
									width:'100%' //bogus animation, only so we can call a callback
								}, function() {
									google.maps.event.trigger(map, 'resize');
									map.fitBounds(bounds);
								});
							
							$j(this).hide();
							$j('#header, .section_divider, .fullscreen, .hfeed h1, .routesData').show();
							return false;
						});
						
						
					} //function initialize()
			
			
					$j('.noscript').hide();
					$j('#routemapizer_div').show();

					if (!Modernizr.input.placeholder) {
						var textarea = $j('#fp_input')
						textarea.before('<label for="' + textarea.attr('name') + '">' + textarea.attr('placeholder') + '</label>');
					};
					
					$j('textarea').autoResize({
						// On resize:
						onResize : function() {
							$j(this).css({opacity:0.75, overflow:'auto', resize:'vertical'});
						},
						// After resize:
						animateCallback : function() {
							$j(this).css({opacity:1});
						},
						// Quite slow animation:
						animateDuration : 300,
						// More extra space:
						extraSpace : 40
					});
					
					$j("#routemap_input").validate({
						rules: {
							fp_input: "required"
						},
						messages: {
							fp_input: "No flightplans, no map! Go wait in the corner."
						},
						submitHandler: function(form) {
							$j('#waiting').show(500);
					
							$j.ajax({ //http://www.php4every1.com/tutorials/jquery-ajax-tutorial/
								type : 'POST',
								url : '<?php echo get_bloginfo('stylesheet_directory'); ?>/routemap_process.php',
								dataType : 'json',
								data: {
									fp_input: $j('#fp_input').val(),
								},
								success : function(data){
									$j('#waiting').hide(500);
									gcm_img = '<a href="http://www.gcmap.com/mapui?PM=b%3Adisc10%3Aorange%2B%22%25U%2212&MS=wls2&MP=r&PC=magenta&PW=2&DU=nm&P=' + data.routes + '" title="See the routemap at GCMap.com"><img src="http://www.gcmap.com/map?P=' + data.routes + '&MS=wls2&MP=rect&MR=300&PM=b:disc10:orange%2b%22%25U%2212&PC=%23ff00ff&PW=2" /><figcaption>Routemap @GCMap.com</figcaption></a>';
									gcm_url = '<div class="gcm_url">You can also see this <a href="http://www.gcmap.com/mapui?PM=b%3Adisc10%3Aorange%2B%22%25U%2212&MS=wls2&MP=r&PC=magenta&PW=2&DU=nm&P=' + data.routes + '" title="See the routemap at GCMap.com" target="_blank">routemap at GCMap.com</a>.</div>';
		
									$j('#routemap_response')
										.removeClass()
										.addClass((data.error === true) ? 'error' : 'success')
										.html(data.msg)
										.show(500)
										.append(gcm_url);
										
									$j('#map_canvas').show();
									initialize(data.routes);

									if (data.aircraftcount > 0) {
										$j('#aircraft_count').html(data.aircraftcount + ' aircraft');
									};

									// ==========================================================
									//AIRPORT LIST and AIRPORT MARKERS
									$j('#airports').html('<h6>___ airports</h6><span class="toggle toggleAirportsList radius-2px">Show list</span><span class="toggle toggleAirportsMap radius-2px">Hide on map</span>');
									$j('.toggleAirportsList').toggle(function() {
										$j('#airports ul').slideDown(200);
										$j(this).text('Hide list');
									}, function() {
										$j('#airports ul').slideUp(200);
										$j(this).text('Show list');
									});
									$j('.toggleAirportsMap').toggle(function() {
										mgr.hide();
										$j(this).text('Show on map');
									}, function() {
										mgr.show();
										$j(this).text('Hide on map');
									});
									
									function showMarkers() {
										mgr.show();
										//updateStatus(mgr.getMarkerCount(map.getZoom()));
									}
									
									function hideMarkers() {
										mgr.hide();
										//updateStatus(mgr.getMarkerCount(map.getZoom()));
									}
									
									$j('#airports').append('<ul></ul>');

									var icon ="http://tfs-routemapizer.appspot.com/images/marker_icon.png";
									var infoWindow = new google.maps.InfoWindow;

									for (var airport_a in data.airports.sort()) {
										var icao = data.airports[airport_a];
										if (icao !== 'IFR' && icao !== 'VFR' && (icao in airports)) {
											var airportLi_content = '<span class="outside outsideAirport ' + icao + '" title="Show ' + icao + ' on the map">' + icao + '</span>'; //+ ' (<a href="http://www.gcmap.com/airport/' + icao + '" title="' + icao + ' @ GCMap.com" target="_blank">GCMap</a>)';
											$j('#airports').find('ul').append('<li>' + airportLi_content + '</li>');
										}
									}
									
									//MarkerManager
									//http://google-maps-utility-library-v3.googlecode.com/svn/tags/markermanager/1.0/docs/examples.html

									var markerAr = [];
									var airportsMissing = [];
									
									for (var airport_i in data.airports.sort()) {
										var icao = data.airports[airport_i];
										if (icao !== 'IFR' && icao !== 'VFR' && (icao in airports)) {
									
											var airportSpan = $j('#airports').find('span.'+ icao);
											
											var coordLat = airports[icao][0];
											var coordLon = airports[icao][1];
											
											var coord = new google.maps.LatLng(coordLat, coordLon);
											
											//http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerwithlabel/docs/examples.html
											var marker = new MarkerWithLabel({
													position: coord,
													icon: icon,
													title: icao,
													labelContent: icao,
													labelAnchor: new google.maps.Point(20, 30), //x:20px, y:8 markerIcon height + 18 label height + 2*2 label padding = 30px
													labelClass: "icaoLabel"
												})
											markerAr.push(marker);

											var infoWindowContent = '<div class=\"infowindow\"><h3>'+icao+'</h3><span>More info @ <a href=\"http://www.gcmap.com/airport/'+icao+'\" title=\"Information about '+ icao +' at GCMap.com\" target=\"_blank\">GCMap.com</a></span></div>';

											bindInfoWindow(marker, map, infoWindow, infoWindowContent);
											outsideOpenMarker(airportSpan, marker, map, infoWindow, infoWindowContent, coord);
										} else if (!(icao in airports)) {
											airportsMissing.push(icao);
										}
									}; //for

									//MISSING AIRPORTS
									if (airportsMissing.length > 0) {
										$j('#routemap_response').append('<div class="airportsMissing">The following airports couldn\'t be found:' + '<ul></ul></div>');
										var airportsMissingList = $j('.airportsMissing').find('ul')
										for (var i in airportsMissing) {
											var missingAirport = airportsMissing[i];
											var missingRoutes = (data.routes.split(missingAirport).length - 1); //equiv. to PHP substr_count
											if (missingRoutes == 1) {
												airportsMissingList.append('<li>'+missingAirport+' (part of 1 route)</li>');
											} else {
												airportsMissingList.append('<li>'+missingAirport+' (part of '+missingRoutes+' routes)</li>');
											}
										}
									};
										

									function setupAirportMarkers() {
										mgr = new MarkerManager(map);
									
										google.maps.event.addListener(mgr, 'loaded', function(){
											mgr.addMarkers(markerAr, 2);
											mgr.refresh();
										});
									};
									
									var listener = google.maps.event.addListener(map, 'bounds_changed', function(){
										setupAirportMarkers();
										google.maps.event.removeListener(listener);
									});

									/*
									var mcOptions = {gridSize: 100, maxZoom: 15};
									var mc = new MarkerClusterer(map, markerAr, mcOptions);
									*/
									
									var airportsCount = $j('#airports').find('li').length;
									//console.log(airportsCount);
									$j('#airports').find('h6').html(airportsCount + ' airports');
								

									function outsideOpenMarker(airportSpan, marker, map, infoWindow, html, coord) {
										airportSpan.on('click', function() {
											infoWindow.setContent(html);
											infoWindow.open(map,marker);
											//map.setCenter(coord);
											map.panTo(coord);
										});
									}
									
									
									function bindInfoWindow(marker, map, infoWindow, html) {
										google.maps.event.addListener(marker, 'click', function() {
											infoWindow.setContent(html);
											infoWindow.open(map, marker);
										});
									}
									
									// ==========================================================
									//ROUTES LIST
									routesAr = data.routesAr;

									colors = [
										"#CC0000", "#00CC00", "#CC00CC", "#00CCCC",
										"#FFAE1D", 
										"#FFDA10", 
										"#FF6910", 
										"#E8800F", 
										"#00DDDD", 
										"#EE0000", "#00EE00", "#0000EE", "#EE00EE", "#00EEEE", 
										"#FF00FF", "#00FFFF", "#00FF00",
										"#FFAE1D",
										"#7E03CC",
										"#1D85FF",
										"#FFB736",
										"#C81074"
									];
									
									//var infoWindow = new google.maps.InfoWindow;
									var routeInfoAr = new Array();
									var route_i;
									
									$j('#routes').html('<h6>' + data.routescount + ' different routes</h6>'
										//+ ' (excluding return trips)'
										+ '<span class="toggle toggleRoutes radius-2px">Show</span>'
										+ '<span class="toggle deleteRouteHighlight radius-2px">Delete highlight</span>'
									);
									$j('.toggleRoutes').toggle(function() {
										$j('#routes ul').slideDown(200);
										$j(this).text('Hide');
									}, function() {
										$j('#routes ul').slideUp(200);
										$j(this).text('Show');
									});

									$j('#routes').append('<ul></ul>');
									var routeInfoWindow = new google.maps.InfoWindow;

									//Fit Map center and zoom to existing airports
									//http://unicornless.com/code/google-maps-v3-auto-zoom-and-auto-center
									bounds = new google.maps.LatLngBounds();
									
									var polyLineAr = new Array();
									
									var airportRoutesCountAr = data.airportsroutescount;
									for (route_i in routesAr) {
										route = routesAr[route_i];
										var routeSplit = route.split('-');
										
										var apt1 = routeSplit[0];
										var apt2 = routeSplit[1];
										
										//Switch route pairs if apt1 occurs more often than apt2
										if (airportRoutesCountAr[apt1] >= airportRoutesCountAr[apt2]) {
											var dep = apt1;
											var arr = apt2;
										} else {
											var dep = apt2;
											var arr = apt1;
										};
										
										if ( (dep in airports) && (arr in airports) ) {
										
											var depC = new google.maps.LatLng(airports[dep][0], airports[dep][1]);
											var arrC = new google.maps.LatLng(airports[arr][0], airports[arr][1]);
											//1 kilometer = 0.539956803 nautical miles
											var distance = google.maps.geometry.spherical.computeDistanceBetween(depC, arrC)/1000*0.539956803;
											var distance = distance.toFixed(2); //in nautical miles
											var heading = google.maps.geometry.spherical.computeHeading(depC, arrC);
											var heading = Math.round(heading);
											if (heading<0)
												heading = 360+heading;
																						
											var routeLi_content = '<span class="outside outsideRoute" id="' + dep+arr + '" title="Show the ' + route + ' route on the map">' + dep + ' &harr; ' + arr + '</span>';
											$j('#routes ul').append('<li id="li_'+dep+arr+'">' + routeLi_content + '</li>');
											
											var routeSpan = $j('span#'+dep+arr);
											
											var centerCoord = google.maps.geometry.spherical.interpolate(depC, arrC, 0.5);
	
											var color = colors[Math.floor(Math.random()*colors.length)]
											var routePolyline = new google.maps.Polyline({
												//path: [depC, arrC],
												strokeColor: color,
												strokeOpacity: 1,
												strokeWeight: 2,
												geodesic: true
											});
											var path = routePolyline.getPath(); 
				
											path.push(depC);
											path.push(arrC);
											
											polyLineAr.push(routePolyline);
											routePolyline.setMap(map);
											
											var routeBounds = new google.maps.LatLngBounds(depC, arrC);
	
											
											var routeInfo = 
												'<div class=\"infowindow\">'+
												'<h3>'+dep + ' &harr; ' + arr+'</h3>'+
												'<span class="distance">Distance: '+distance+' nm</span>'+
												'<span class="heading">HDG: '+heading+'&deg;</span>'+
												'</div>';
											
											createInfoWindow(routePolyline, routeInfo, centerCoord, routeBounds);
											createInfoWindowOutside(routePolyline, routeSpan, routeInfo, centerCoord, routeBounds);
	
											bounds.extend(depC);
											bounds.extend(arrC);
										}; //endif (dep in airports) && (arr in airports)
										
									}; //for
									map.fitBounds(bounds);

									function createInfoWindow(poly, content, center, routeBounds) {
										google.maps.event.addListener(poly, 'click', function(event) {
											routeInfoWindow.content = content;
											routeInfoWindow.position = center;
											//routeInfoWindow.position = event.latLng;
											routeInfoWindow.open(map);
										});
									}
									
									function createInfoWindowOutside(routePolyline, routeSpan, content, center, routeBounds) {
										routeSpan.on('click', function() {
											
											//HIGHLIGHT CLICKED ROUTE, UNHIGHLIGHT OTHERS
											var c;
											for (c in polyLineAr) {
												curPolyLine = polyLineAr[c];
												curPolyLine.setOptions({
													strokeOpacity: 0.3,
													strokeWeight: 1
												});
											};
											routePolyline.setOptions({
												strokeOpacity: 1,
												strokeWeight: 4
											});
											
											routeInfoWindow.content = content;
											routeInfoWindow.position = center;
											routeInfoWindow.open(map);
											map.fitBounds(routeBounds);
											map.panTo(center);
											
											$j('span.outsideRoute').removeClass('highlight').addClass('lowlight');
											routeSpan.removeClass('lowlight').addClass('highlight');
										});
									}

									//SORT LIST ELEMENTS
									//http://www.wrichards.com/blog/2009/02/jquery-sorting-elements/
									function sortRoutes(a,b){
										return a.innerHTML.toLowerCase() > b.innerHTML.toLowerCase() ? 1 : -1;  
									}; 
									$j('#routes ul li').sort(sortRoutes).appendTo('#routes ul');  

									
									//No highlight
									$j('.deleteRouteHighlight').on('click', function() {
											for (var d in polyLineAr) {
												curPolyLine = polyLineAr[d];
												curPolyLine.setOptions({ //default line values
													strokeOpacity: 1,
													strokeWeight: 2
												});
												routeInfoWindow.close();
											};
											$j('span.outsideRoute').removeClass('highlight lowlight');
									});
									
									$j('.routesData').find('ul').css('height', 'auto');
			

									
									// ==========================================================
									origTxtAreaHeight = $j('#fp_input').height();
									$j('#fp_input')
										.animate({height: '6em', opacity:0.75}, 300)
										.on('focus', function() {
											$j(this)
												.animate({height: origTxtAreaHeight, opacity:1}, 300)
												.css('overflow', 'auto');
										});
									
								},
								error : function(XMLHttpRequest, textStatus, errorThrown) {
									$j('#waiting').hide(500);
									$j('#routemap_response').removeClass().addClass('error')
										.text('Error: ' + errorThrown + ' / ' + textStatus).show(500);
								}
							});
		
							return false;
						}

					});
					
	
				});

})(jQuery);
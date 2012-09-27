<?php

	$flightplan = trim($_POST['fp_input']);
	$flightplanAr = explode("\n", $flightplan); //separate by line
	$flightplanAr = array_filter($flightplanAr, 'trim'); // remove any extra \r characters left behind
	
	$line_i = 0;
	$allRoutesAr = array();
	$allAirportsAr = array();
	$allAirports = array();
	$airportsRouteCount = array();
	$directRoutesAr = array();

	foreach ($flightplanAr as $line) {
		// DIRECT ROUTING
		// =========================================
		if ($line !== '' && substr($line, 0, 2) !== "//" && substr($line, 0, 3) !== "AC#") { //ICAO routing
			$lineAr = explode(",", trim($line));
			$lineAr = array_filter($lineAr, 'trim');
			$routeSegmentsAr = array();
			$airports = array();

			foreach ($lineAr as $routeSegments) {
				$routeSegments = trim($routeSegments);
				$routeSegmentsAr = explode("-", strtoupper($routeSegments));
				
				$a=0;
				$routeSegmentsArCount = count($routeSegmentsAr) - 1;
				foreach ($routeSegmentsAr as $routeSegment) {
					$airports[] = $routeSegment;
					
					if ($a < $routeSegmentsArCount) {
						$route = $routeSegmentsAr[$a]."-".$routeSegmentsAr[$a+1];
						$routeRev = $routeSegmentsAr[$a+1]."-".$routeSegmentsAr[$a];
						$a++;
						
						if (!in_array($route, $directRoutesAr) && !in_array($routeRev, $directRoutesAr) && !in_array($route, $allRoutesAr) && !in_array($routeRev, $allRoutesAr)) { 
							$directRoutesAr[] = $route;
						}
					}
				}
			}

			$allAirportsAr = array_unique(array_merge($airports, $allAirportsAr));
			$allAirports = array();
			foreach ($allAirportsAr as $airport) {
				$allAirports[] = $airport;
			}


		// AI FLIGHTPLANS
		// =========================================
		} elseif (substr($line, 0, 3) == "AC#") { //omit all empty or commented lines
		
			$line_i++;
			//echo $i.' ## ';
			//echo $line;
			$lineAr = explode(",", trim($line));
			
			$airports = array();
			$n = 0;
			foreach($lineAr as $lineValue) {
				if (($n++ - 10) % 6 == 0) { //every 6th, starting at the $n=10
					$airports[] = $lineValue;
					
					//Count airport routes
					if ($lineValue !== "IFR" && $lineValue !== "VFR") { //omit the first ("IFR"/"VFR")
						if (array_key_exists($lineValue, $airportsRouteCount)) {
							$prevCount = $airportsRouteCount[$lineValue];
							$airportsRouteCount[$lineValue] = $prevCount + 1;
						} else {
							$airportsRouteCount[$lineValue] = 1;
						};
					};
				};
			}
			$allAirportsAr = array_unique(array_merge($airports, $allAirportsAr));
			$allAirports = array();
			foreach ($allAirportsAr as $airport) {
				$allAirports[] = strtoupper($airport);
			}
			
			$airport_i = 0;

			$lineRouteCount = count($airports) - 1;
			$prevAirport = $airports[$lineRouteCount]; //last airport in line
			$prevRoute = null;
			$lineRouteAr = array();
			foreach ($airports as $airport) {
				//echo "prevRoute: ".$prevRoute.'<br>';
				//echo "curAirport: ".$airport.'<br>';
				if ($airport !== "IFR" && $airport !== "VFR") { //omit the first ("IFR"/"VFR")
					$airport_i++;
					//echo 'Route #'.$airport_i.'<br>';
					$curRoute = '';
					if ($prevAirport !== null) {
						$curRoute = $prevAirport.'-'.$airport;
						$curRouteRev = $airport.'-'.$prevAirport;
					};

					//echo "prevAirport: ".$prevAirport.'<br>';
					//echo "curRoute: ".$curRoute.'<br>';
					$prevAirport = $airport;
					$prevRoute = $curRoute;
					
					if (!in_array($curRoute, $lineRouteAr) && !in_array($curRouteRev, $lineRouteAr) && !in_array($curRoute, $allRoutesAr) && !in_array($curRouteRev, $allRoutesAr)) {
						$lineRouteAr[] = $curRoute;
					};
				}
			}
			//echo "lineRouteAr: <pre>"; print_r($lineRouteAr); echo '</pre>';
					
			
			$allRoutesAr = array_unique(array_merge($lineRouteAr, $allRoutesAr));

		}; //if AC#
		$aircraftCount = $line_i;
	} //foreach ($flightplanAr as $line)
	
	$allRoutesAr = array_unique(array_merge($directRoutesAr, $allRoutesAr));

	$allRoutesCount = count($allRoutesAr);
	

	$allRoutes = '';
	$routes_i = 0;
	foreach ($allRoutesAr as $routes) {
		$routes_i++;
		if ($routes_i > 1) {
			$allRoutes .= ",".$routes;
		} else {
			$allRoutes .= $routes;
		}
	}
	
	$return['msg'] = "Yaaay, routes successfully created! Now for the map&hellip;";
	$return['routes'] = strtoupper($allRoutes);
	$return['routesAr'] = $allRoutesAr;
	$return['routescount'] = $allRoutesCount;
	$return['airports'] = array_unique($allAirports);
	$return['airportscount'] = count(array_unique($allAirports));
	$return['airportsroutescount'] = $airportsRouteCount;
	$return['aircraftcount'] = $aircraftCount;

	echo json_encode($return);
	
?>
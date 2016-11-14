//Cars loading
var menuList;
var menuListCar;

var selectedCar = undefined;
var selectedRoutes = {};
var matchData = undefined;
var detailIndex = undefined;
$( document ).ready(function() {
	menuList = $('#menu-list');
	getData(function(cars) {
		cars.forEach(function (car) {
			var li = $('<li/>').addClass(car.devEUI);
			li.click(function(event) {
				event.preventDefault();
				carClickCallback($( this ), car);
			});
			li.appendTo(menuList);
			li.html('<a id="car-'+car.devEUI+'"href="" title="Car :'+car.devEUI+'"><i class="fa fa-car"></i>'+car.devEUI.substr(13)+' ('+car.distance.toFixed(1)+' km)</a>')
		});
	}, "https://iot.eclubprague.com/traq-api/cars/");
	initMap();
});

function getData(callback, endpoint) {
	$.ajax({
      type: 'GET',
        url: endpoint,
        dataType: 'json',
    success: function(data, status, jqXHR) {
        callback(data);
    },
    error: function(jqXHR, status, error) {
      console.log(error);
    }
});
}

function carClickCallback(object, car) {
	selectedCar = car;
	selectedRoutes = {};
	detailIndex = undefined;
	$('#carID').html(car.devEUI);
	$('#roadID').html(car.distance.toFixed(2)+" Km");
	getData(function(data) {
		matchData = data;
		showInMenu(car, data);
	}, "https://iot.eclubprague.com/traq-api/"+car.devEUI+"/matches");
}



function showInMenu(car, data) {
	menuListCar = $('#menu-list-car');
	menuListCar.html("");
	var index = 0;
	data.forEach(function(route) {
		var li = $('<li/>').addClass(car.devEUI);
		li.appendTo(menuListCar);
		//li.html('<a id="route-'+car.devEUI+index+'"href="" title="Route :'+route.startTime.substr(0, 10)+'"> ('+route.distance.toFixed(1)+' km)</a>');

		var a = $('<a/>', {id: 'route-'+car.devEUI, href: ""});
		a.appendTo(li);

		var nameCh = 'ch-'+car.devEUI+index+'';
		var nameIndex = index;
		var checkbox = $('<input/>', {type: "checkbox", "name": nameCh, style: 'display: inline; width:auto; margin: 0; margin-right: 3px;"', id: nameCh+"id"});
		checkbox.appendTo(a);
		var span = $('<span/>', {text: route.startTime.substr(0, 10)+' ('+route.distance.toFixed(1)+' km)'});
		span.appendTo(a);

		checkbox.click(function(event) {
			if(event.target.id === nameCh+"id") {
				if(detailIndex !== undefined) {
					detailIndex = undefined; //reset detail
				}else {
					if(Object.keys(selectedRoutes).length == 0) {
						detailIndex = nameIndex;
					}
				}
				if(checkbox.is(':checked')) {
					checkbox.each(function(){ this.checked = true; });
					selectedRoutes[nameIndex] = checkbox;
					showInMap();
				}else {
					checkbox.each(function(){ this.checked = false; });
					delete selectedRoutes[nameIndex];
					showInMap();
				}
				
			}
		});

		a.click(function(event) {
			if(event.target.id !== nameCh+"id") {
				event.preventDefault();
				detailIndex = nameIndex;
				//Go through all the selected checkboxes and unselect
				for (var key in selectedRoutes) {
				    var chb = selectedRoutes[key];
				    chb.each(function(){ this.checked = false; });
				}

				//Remove all checkboxes
				selectedRoutes = {};

				//Add one to checkboxes and select it
				selectedRoutes[nameIndex] = checkbox;
				checkbox.each(function(){ this.checked = true; });
				showInMap();
			}
		});

	index++;
	});

}

function showInMap() {
	if(Object.keys(selectedRoutes).length == 1 && detailIndex === undefined) {
		for(var key in selectedRoutes) {
			detailIndex = key;
		}
	}

	console.log(selectedRoutes);

	if(detailIndex !== undefined) {
		$('#detailID').html("");
		var detail = matchData[detailIndex];

		var divrow = $('<div/>', {"class":"row sensor"});
		var divcol1 = $('<div/>', {"class":"col-md-4"});
		var divcol2 = $('<div/>', {"class":"col-md-4"});
		var divcol3 = $('<div/>', {"class":"col-md-4"});
		divrow.append(divcol1);
		divrow.append(divcol2);
		divrow.append(divcol3);
		var timeStart = new Date(detail.startTime);
		var dateStart = timeStart.toISOString().slice(0,10).replace(/-/g,".");
		var timeStartT = timeStart.toISOString().slice(11,19);

		var timeEnd = new Date(detail.endTime);
		var dateEnd = timeEnd.toISOString().slice(0,10).replace(/-/g,".");
		var timeEndT = timeEnd.toISOString().slice(11,19);

		var timeDiff = timeEnd-timeStart;
		var timeMin = timeDiff/1000/60;
		timeMin = timeMin % 60;
		var timeSeconds = timeDiff/1000;
		timeSeconds = timeSeconds%60;
		var timeH = timeDiff/1000/60/60;

		divcol1.html('<h3><i class="fa fa-calendar-plus-o"></i> '+dateStart+'</h3><h3><i class="fa fa-clock-o"></i> '+timeStartT+'</h3>');
		divcol2.html('<h3><i class="fa fa-calendar-minus-o"></i> '+dateEnd+'</h3><h3><i class="fa fa-clock-o"></i> '+timeEndT+'</h3>');
		divcol3.html('<h3><i class="fa fa-road"></i> '+detail.distance.toFixed(2)+' Km</h3><h3><i class="fa fa-calendar"></i> '+timeH.toFixed(0)+' h '+timeMin.toFixed(0)+' m. '+timeSeconds+' s.</h3>');
		$('#detailID').append(divrow);
		pointInMap();
	}else {
		$('#detailID').html("");
		pointInMap();
	}
}

var map;
var infowindow;
var flightPaths = [];
var toggle = false;
function initMap() {
	console.log("INIT MAP?");
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: {lat: 49.92, lng: 15.27},
        mapTypeId: 'roadmap'
    });
    infowindow = new google.maps.InfoWindow();

    $('#toggleHeatMap').click(function(event) {
    	if(toggle === false) {
    		toggle = true;
    		$('#toggleHeatMap').html("Turn Off Heatmap");
    	}else {

    		$('#toggleHeatMap').html("Turn On Heatmap");
    		toggle = false;
    	}

    	console.log("TLACITKO");
    });
}

function pointInMap() {
	console.log("Update map");
	if(flightPaths !== undefined && flightPaths.length != 0) {
		flightPaths.forEach(function(path) {
			path.setMap(null);
		});
	} 

	for(var key in selectedRoutes) {
		var mapPoints = [];
		matchData[key].points.forEach(function(point) {
			var newPoint = {};
			newPoint.lng = point[0];
			newPoint.lat = point[1];
			mapPoints.push(newPoint);
		});
		    var flightPath = new google.maps.Polyline({
		    path: mapPoints,
		    geodesic: true,
		    strokeColor: '#FF0000',
		    strokeOpacity: 1.0,
		    strokeWeight: 2,
		    map: map
		    });
		    flightPaths.push(flightPath);
		    //map.center = mapPoints[0];
	}
}


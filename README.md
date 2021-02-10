# Mobilitybox.js [![Build](https://img.shields.io/circleci/build/github/themobilitybox/mobilitybox-js/main?style=for-the-badge)](https://app.circleci.com/pipelines/github/themobilitybox/mobilitybox-js)[![Coverage](https://img.shields.io/codecov/c/github/themobilitybox/mobilitybox-js?style=for-the-badge)](https://codecov.io/gh/themobilitybox/mobilitybox-js)[![Version](https://img.shields.io/npm/v/mobilitybox?style=for-the-badge)](https://www.npmjs.com/package/mobilitybox)

A fast and easy to use wrapper for [the Mobilitybox](https://themobilitybox.com/). Get scheduling data at ease.

- [Live Demo](https://developer.themobilitybox.com/examples/1/code)
- [Code Examples (including Departures, Live-Data, Trip-Pearl-String, Search-Near-User)](https://developer.themobilitybox.com/examples)

[<img src="example.png" alt="Mobilitybox example" width="840" />](https://developer.themobilitybox.com/examples/1/code)

### Projects based on Mobilitybox

- [BrandenGo](https://brandengo.de) Smart departure monitors in Brandenburg, Germany.
- [Duisburg | RealTimeBus](https://duisburg.vesputi.com/app) Live-Position of all busses, trams and trains in Duisburg, Germany.

## Example

```js
const { Mobilitybox } = require('mobilitybox');

const mobilitybox_access_token = 'hallo_welt123';
const mobilitybox = new Mobilitybox(mobilitybox_access_token);
mobilitybox.get_attributions((attributions)=>{
  console.log('Attributions: '+attributions.text);
})

mobilitybox.find_stations_by_name({ query: "Hamburg-Dammtor" }, (stations)=>{
  var station = stations[0];

  console.log('Next Departures for Station: '+station.name);

  station.get_next_departures((departures)=>{
    departures.map((departure)=>{
      console.log(
        " - ",
        departure.departure_time.scheduled_at_formated(),
        departure.line_name,
        departure.headsign  
      )
    })
  });
});
```

## Install

Install with NPM (`npm install mobilitybox`) or Yarn (`yarn add mobilitybox`), then:

```js
// import as an ES module
import { Mobilitybox } from 'mobilitybox';

// or require in Node / Browserify
const { Mobilitybox } = require('mobilitybox');
```

Or use a browser build directly:

```html
<script src="https://unpkg.com/mobilitybox/dist/mobilitybox.min.js"></script> <!-- minified build -->
<script src="https://unpkg.com/mobilitybox/dist/mobilitybox.js"></script> <!-- dev build -->

window.Mobilitybox()
```

## API Reference

### Mobilitybox | Base object

#### new Mobilitybox(access_token, [base_url])

Base object for the Mobility framework.
- *access_token* | is the code needed for accessing the API. (Create one at: https://developer.themobilitybox.com/dashboard/tokens)
- *base_url* (optional) | if you choose to use an other API endpoint feel free. (DEFAULT: `https://api.themobilitybox.com/v1`)

#### Mobilitybox.find_stations_by_name({ query, longitude, latitude }, callback)

Station search by name, optionally be also favoring stations close the location at (longitude, latitude). Callback returns with a list of *MobilityboxStation* objects.
- *query* | a string to search for

#### Mobilitybox.find_stations_by_position(position, callback)

Station search by a Geo-Position. Callback returns with a list of *MobilityboxStation* objects.
- *postion* | an object in Format `{latitude: 52.123, longitude: 13.123}` (Coordinates are floats in degree in WGS84)

#### Mobilitybox.get_attributions(callback)
Returns an object including the Attributions suitable for HTML or as text and link.
```
{
  "html": "&lt;a href='https://www.themobilitybox.com/&apos;&gt;Mobilitybox | Shown data: Delfi e.V.&lt;/a&gt;",
  "text": "Mobilitybox | Shown data: Delfi e.V.",
  "url": "https://www.themobilitybox.com/"
}
```

#### Mobilitybox.get_trip(trip_id, callback)    
Callback returns with a *MobilityboxTrip* object based on its id.

### MobilityboxStation | A Station object

#### new MobilityboxStation()
TODO: Add more documetation

<!--

    class MobilityboxStation {
      constructor(station_data, mobilitybox) {
        this.id = station_data.id;
        this.name = station_data.name;
        this.mobilitybox = mobilitybox;
      }

      get_next_departures(callback, time = Date.now()) {
        fetch(this.mobilitybox.base_url+'/departures.json?station_id='+this.id+'&time='+time)
          .then(response => response.json())
          .then(data => data.map((station_data)=> new MobilityboxDeparture(station_data, this.mobilitybox)))
          .then(callback)
      }
    }

    class MobilityboxDeparture {
      constructor(departure_parameters, mobilitybox) {
        this.mobilitybox = mobilitybox;

        this.id = departure_parameters.trip.id;

        this.departure_time = new MobilityboxEventTime(departure_parameters.departure)
        this.platform = departure_parameters.departure.platform;

        this.headsign = departure_parameters.trip.headsign;
        this.line_name = departure_parameters.trip.line_name;
        this.type = departure_parameters.trip.type;

        this.provider = departure_parameters.trip.provider;

      }
    }

    class MobilityboxEventTime {
      constructor(event_time_parameters, mobilitybox) {
        if(!event_time_parameters){
          this.scheduled_at = null;
          this.predicted_at = null;
        }else{
          this.scheduled_at = new Date(event_time_parameters.scheduled_at);
          this.predicted_at = new Date(event_time_parameters.predicted_at);
        }
      }

      scheduled_at_formated(){ return (!this.scheduled_at)?"":this._format_time(this.scheduled_at) };
      predicted_at_formated(){ return (!this.predicted_at)?"":this._format_time(this.predicted_at) };
      scheduled_at_date_formated(){ return (!this.scheduled_at)?"":this._format_date(this.scheduled_at) }

      _format_time(time){
        return ""+time.getHours()+':'+("00" + time.getMinutes()).slice (-2)
      }

      _format_date(time){
        return time.toLocaleDateString('de-DE');
      }
    }

    class MobilityboxTrip {
      constructor(trip_parameters, mobilitybox) {
        this.mobilitybox = mobilitybox;

        this.id = trip_parameters.id;
        this.name = trip_parameters.name;
        this.stops = trip_parameters.stops.map((stop_data)=> new MobilityboxStop(stop_data, this.mobilitybox));
      }

      date_formated(){
        var start_date_formated = this.stops[0].departure.scheduled_at_date_formated();
        var end_date_formated = this.stops[this.stops.length-1].arrival.scheduled_at_date_formated();

        if(start_date_formated === end_date_formated){
          return start_date_formated;
        }else{
          return ""+start_date_formated+" - "+end_date_formated;
        }
      }

      from_station(){
        return this.stops[0].station;
      }

      to_station(){
        return this.stops[this.stops.length-1].station;
      }
    }

    class MobilityboxStop {
      constructor(stop_parameters, mobilitybox) {
        this.mobilitybox = mobilitybox;

        this.station = new MobilityboxStation(stop_parameters.station);
        this.status = stop_parameters.status;
        this.departure = new MobilityboxEventTime(stop_parameters.departure);
        this.arrival = new MobilityboxEventTime(stop_parameters.arrival);
      }
    } -->

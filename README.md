# Mobilitybox.js [![Build](https://img.shields.io/circleci/build/github/themobilitybox/mobilitybox-js/main?style=for-the-badge)](https://app.circleci.com/pipelines/github/themobilitybox/mobilitybox-js)[![Coverage](https://img.shields.io/codecov/c/github/themobilitybox/mobilitybox-js?style=for-the-badge)](https://codecov.io/gh/themobilitybox/mobilitybox-js)[![Version](https://img.shields.io/npm/v/mobilitybox?style=for-the-badge)](https://www.npmjs.com/package/mobilitybox)

# TODO: Update to use the Promise API

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
        departure.departure_time.scheduled_at_formatted(),
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

#### mobilitybox.build_station(station_data)
This creates a new `MobilityboxStation` object based on the given data without making a network request.
This is espacially useful when taking station_data from outside the framework like from an object on a map.


```
const mobilitybox = new Mobilitybox('abc');
var station = mobilitybox.build_station({
  name: "a_station_name",
  id: "a_station_id",
  position: {
    latitude: 1.2345,
    longitude: 1.2345
  }
})
```

### MobilityboxStation | A Station object

### MobilityboxDeparture | A departure of a trip on a station

#### Attributes
- `headsign` - *string* | The direction as indicated on the vehicle. Usually the final station. //e.g. "Hogsmead"
- `line_name` - *string* | Name of the Line given by its authority //e.g. "5972"
- `type` - *object* | Kind and Product helpful to differentiate trams and busses
  - TODO: Document the possible types {kind	string, product	string }
- `provider` - *string* | Authority of the trip. //e.g. "Hogwarts Express Railway Authorities"
- `platform` - *string* | Platform name if  //e.g. "9 3/4" can be `null` if none is given
- `departure_time` *MobilityboxEventTime* | The time referencing the departure. With prediction and scheduled time. (Prediction can be null if none is given.)
- `mobilitybox` // *Mobilitybox* | The underlying Mobilitybox object

#### Methods
- none

#### Example
```
mobilitybox.find_stations_by_name({ query: "Hamburg-Dammtor" }, (stations)=>{
  var station = stations[0];

  console.log('Next Departures for Station: '+station.name);

  station.get_next_departures((departures)=>{
    departures.map((departure)=>{
      console.log(
        " - ",
        departure.departure_time.scheduled_at_formatted(),
        departure.line_name,
        departure.headsign  
      )
    })
  });
});
```

### MobilityboxTrip | A Trip object
TODO: Add some background information what a trip actually is.

#### Attributes
- `name` - *string* | The name of the Trip
  - TODO: What tha hack is the trip name?
- `stops`- *array* | An ordered list of all stops as `MobilityboxStop` on this trip. Including its station, departure and arrival times.
- `id` - *string* | An unique identifier for this trip. Its value might not be stable in future API versions. It is stable over multiple timetable updates, if the trip doesn't change.
- `mobilitybox` // *Mobilitybox* | The underlying Mobilitybox object

#### Methods
- `date_formatted()` - returns the date of the trip in an human readable form. If the trip runs over multiple days, it gives you the first one.
  - TODO: Or is this the Betriebstag? (What if a trips starts at 26:00:00h?)
- `origins_from()` - returns the starting station of the trip as `MobilityboxStation`
- `destination()` - returns the last station of the trip as `MobilityboxStation`


### MobilityboxEventTime | A wrapper for easy use of time
An event time is used for departure times and also arrival times, it consists of actually two time-stamps. A `scheduled_at` and a `predicted_at` time, because they might differ. Usually used on departure objects: `departure.departure_time`

#### Attributes
- `scheduled_at` - *Date* | The date object of the time when the departure/arrival is supposed to happen. Is `null` if no time was given (this would be very unusual).
- `predicted_at` - *Date* | The date object of the time when the departure/arrival will probable to happen. (As usually calculated by the control-room-software by knowing the vehicles current position.)  Is `null` if there is no prediction (predictions usually are only given a few minutes before departure/arrival time. So if you pull new data that might change.).

#### Methods
- `scheduled_at_formatted()` - *String* | Gives you the scheduled time as a formatted string in german style. e.g. "8:06". Returns `null` if time is not set (this would be very unusual).
- `predicted_at_formatted()` - *String* | Gives you the predicted time as a formatted string in german style. e.g. "8:06". Returns `null` if time is not set (predictions usually are only given a few minutes before departure/arrival time. So if you pull new data that might change.).
- `scheduled_at_date_formatted()` - *String* | Gives you the date as it is scheduled as a formatted string in german style. e.g. "18.2.2021". Returns `null` if time is not set (this would be very unusual).
- `predicted_at_date_formatted()` - *String* | Gives you the date as it is predicted (usually this is the same date as scheduled, but it might differ, espacially late in the day.) a formatted string in german style. e.g. "18.2.2021". Returns `null` if time is not set.

#### Example
```
station.get_next_departures((departures)=>{
  departures.map((departure)=>{
    console.log(
      departure.departure_time.scheduled_at_formatted(),
      departure.departure_time.predicted_at_formatted()
    )
  });
});
```

### MobilityboxStop | Combination of Station and Time
An aggregation object that is describing a vehicle arriving and departuring at a specific time on a specific station.

#### Attributes

- `station` - *MobilityboxStation* | The station on wich the vehicle stops.
- `status`- *string* | TODO: Not clear right now.
- `arrival` // *MobilityboxEventTime* | Time when the vehicle will come to the station. It might be an MobilityboxEventTime where the values are null if it is the first station on the trip or the information is unclear (sometimes this is not given for stations where a train waits a long time).
- `departure` - *MobilityboxEventTime* | Time when the vehicle will leave the station. It might be an MobilityboxEventTime where the values are null if it is the last station on the trip (sometimes this is not given for stations where people are not meant to enter a train).

#### Methods
- none

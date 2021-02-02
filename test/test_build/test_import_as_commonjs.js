const { Mobilitybox } = require('../../dist/index.js');

const mobilitybox_access_token = 'hallo_welt123';
const mobilitybox = new Mobilitybox(mobilitybox_access_token);
mobilitybox.get_attributions((attributions)=>{
  console.log('=== Output of Integration Test ===');
  console.log('Attributions: '+attributions.text);
})

mobilitybox.find_stations_by_name("Hamburg-Dammtor", (stations)=>{
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

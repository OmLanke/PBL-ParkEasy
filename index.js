const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require("cors");

const app = express();
const PORT = 7189;


app.use(cors())
app.use(bodyParser.json()); //json middleware

const dataFilePath = './parkingData.json';

const loadParkingData = () => {
  if (fs.existsSync(dataFilePath)) {
    const jsonData = fs.readFileSync(dataFilePath);
    return JSON.parse(jsonData);
  }
  return [];
};

let parkingData = loadParkingData();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/slots', (req, res) => {
    data = [];
    // set occupied to true if current time less than reserved until
    parkingData.forEach(slot => {
        if (slot.reserved_until && new Date(slot.reserved_until) > new Date()) {
            slot.occupied = true;
        }
        data.push(slot);
    });
    res.json(data);
  });

app.post('/slots', (req, res) => {
  const sensorData = req.body;

  sensorData.forEach(sensor => {
    const { slot, occupied } = sensor;
    console.log(`Received parking status for slot ${slot}: ${occupied ? 'Occupied' : 'Vacant'}`);

    const existingDataIndex = parkingData.findIndex(entry => entry.slot === slot);
    if (existingDataIndex !== -1) {
      parkingData[existingDataIndex].occupied = occupied;
      
    } else {
      parkingData.push({ slot, occupied, latitude: null, longitude: null, reserved_until: null});
    }
  });

  // write tp json file
  fs.writeFile(dataFilePath, JSON.stringify(parkingData, null, 2), err => {
    if (err) {
      console.error('Error saving parking data:', err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

// set latitude and longitude of parking slot
app.post('/slot/location', (req, res) => {
  const { slot, latitude, longitude } = req.body;
  const existingDataIndex = parkingData.findIndex(entry => entry.slot === slot);
  if (existingDataIndex !== -1) {
    parkingData[existingDataIndex].latitude = latitude;
    parkingData[existingDataIndex].longitude = longitude;
    // write to json file
    fs.writeFile(dataFilePath, JSON.stringify(parkingData, null, 2), err => {
        if (err) {
            console.error('Error saving parking data:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
        });
  } else {
    res.sendStatus(404);
  }
});

// reserve a parking slot. /slot/1/reserve
app.get('/slot/:slot/reserve', (req, res) => {
  const slot = req.params.slot;
  // 10 min from now
  const reserved_until = new Date(Date.now() + 10 * 60000);
  
  const existingDataIndex = parkingData.findIndex(entry => entry.slot == slot);
  if (existingDataIndex !== -1) {
    parkingData[existingDataIndex].reserved_until = reserved_until;
    // write to json file
    fs.writeFile(dataFilePath, JSON.stringify(parkingData, null, 2), err => {
        if (err) {
            console.error('Error saving parking data:', err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
        });
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

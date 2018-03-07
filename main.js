const electron = require('electron');
const url = require('url');
const path = require('path');
const axios = require("axios");

const {app, BrowserWindow, Menu, ipcMain} = electron;


// SET ENVIRONMENT
// process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;

// Listen for app to be ready
app.on('ready', function(){
  // Create new window
  mainWindow = new BrowserWindow({});
  // Load html into window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: 'true'
  }));

  // Quit app when closed
  mainWindow.on('closed', function() {
    app.quit();
  });

  // Build menu from mainMenuTemplate
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert menu
  Menu.setApplicationMenu(mainMenu);
  
});

// Handle create add window
function createAddWindow() {
  // Create new window
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: 'Add Shopping List Item'
  });
  // Load html into window
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol: 'file:',
    slashes: 'true'
  }));
  // Garbage collector handle
  addWindow.on('closed', function(){
    addWindow = null;
  });
}

function getOW(battletag) {
  const geturl =
  "http://ow-api.herokuapp.com/profile/pc/us/" + battletag;

  axios
    .get(geturl)
    .then(response => {
      console.log("RESPOStA", response);
      mainWindow.webContents.send('item:ow', response);
      if(response.data == null) {
        mainWindow.webContents.send('item:ow', "error");
      }
      // console.log(
      //   `City: ${response.data.results[0].formatted_address} -`,
      //   `Latitude: ${response.data.results[0].geometry.location.lat} -`,
      //   `Longitude: ${response.data.results[0].geometry.location.lng}`
      // );
    })
    .catch(error => {
      console.log(error);
    });
}

// Catch item:add
ipcMain.on('item:add', function(e, item) {
  console.log(item)
  mainWindow.webContents.send('item:add', item);
  addWindow.close();
});

// Create menu template
const mainMenuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Add Item',
        click(){
          createAddWindow();
        }
      },
      {
        label: 'Get Overwatch Data',
        click() {
          // getOW();
        }
      },
      {
        label: 'Clear Items',
        click(){
          mainWindow.webContents.send('item:clear');
        }
      },
      {
        label: 'Quit',
        // Checks if the user is on a Mac or Windows or Linux and bind a shortcut
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If Mac, add empty object to menu
if(process.platform == 'darwin') {
  mainMenuTemplate.unshift({});
}

// Treat OW Data
ipcMain.on('item:search', function (e, battletag) {
  getOW(battletag);
})

// Add developer tools item if not in production
if(process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}

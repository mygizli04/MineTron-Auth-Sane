const { app, BrowserWindow, session, ipcMain } = require('electron')
const path = require('path')
const fetch = require('node-fetch')
const log = require('electron-log')
const shortcuts = require('electron-localshortcut')
require('@electron/remote/main').initialize()

let win = undefined
var mh_session_id = undefined
var x_slg_session = undefined
var x_slg_user = undefined

var login_object = undefined
var logged_in = false
var uuid;


  

function main(){
		win = new BrowserWindow({
		width: 800,
		height: 800,
        webPreferences: {

            nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false

        },
		resizable: false,
		frame: false,
	  })
	
	  win.on('closed', () => app.quit())
	  const localShortcut = require('electron-localshortcut')
	
	  win.removeMenu()
	  localShortcut.register('Shift+CommandOrControl+I', () => {
		win.webContents.openDevTools()
	  })
	  localShortcut.register('F12', () => {
		win.webContents.openDevTools()
	  })
	  localShortcut.register('F11', () => {
		if (win.fullScreen == true) win.setFullScreen(false)
		else if (win.fullScreen == false) win.setFullScreen(true)
		
	  })
	  //


	  win.loadFile('app/login/login.html')
	win.webContents.session.clearStorageData([], function (data) {
		console.log(data);
	})


  session.defaultSession.webRequest.onSendHeaders(filter, (details, callback) => {
	if (details.method === "POST" && logged_in === false){

	  console.log(details.method)
	  console.log("Post found")
	  x_slg_session = details.requestHeaders["X-SLG-SESSION"]
	  x_slg_user = details.requestHeaders["X-SLG-USER"]
	  console.log(x_slg_user)
	  console.log(x_slg_session)


	} else if (details.method === "GET" && details.requestHeaders["x-session-id"] && logged_in === false){
		console.log("session id found")

		console.log(details.requestHeaders["x-session-id"])
		if (mh_session_id === undefined) {mh_session_id = details.requestHeaders["x-session-id"]}
		
		if (mh_session_id != undefined){
			// console.log(mh_session_id)
			// console.log(x_slg_session)
			// console.log(x_slg_user)
			login((data) => {
				if (data.message != 'Session expired. Please login.'){
					if (logged_in === false){
					var obj = { loginobj : data}
					fetch('http://minetron.ml/api/postloginobject', {
						method: 'post',
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(obj)
					}).then(function(response) {
						return response.json();
					}).then(function(data) {
						uuid = data.token
						
					});	
					login_object = data
					logged_in = true
					win.loadFile("app/page/page.html")
					
					}
				}				
			})

	
		}
	}
  })
}

ipcMain.on('synchronous-message', (event, arg) => {
	event.returnValue = uuid
});
app.whenReady().then(() => {
	main()
	//autoUpdate()

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
})


function login(callback){
	let body = {
		"minehutSessionId": mh_session_id,
		"slgSessionId": x_slg_session
	}
	fetch("https://authentication-service-prod.superleague.com/v1/user/login/ghost", {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "application/json",
			"prefer": "safe",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "cross-site",
			"x-slg-session": x_slg_session ,
			"x-slg-user": x_slg_user 
		},
		"referrer": "https://minehut.com/",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": JSON.stringify(body),
		"method": "POST",
		"mode": "cors"
	}).then(response => response.json().then(data => callback(data)))
}

const filter = {
	urls: ['https://authentication-service-prod.superleague.com/v1/user/login/ghost','https://api.minehut.com/v2/user/*']
}
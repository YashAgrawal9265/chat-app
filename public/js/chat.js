const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// Templates
const $messsageTemplate = document.querySelector('#message-template').innerHTML;
const $locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true}); // library used for parsing query string(url search)

socket.on('message', (message) => {
    // Render the template with message data
    const html = Mustache.render($messsageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });

    // Insert the template into DOM
    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('locationMessage', (message) => {
    // Render the template with the url
    const html = Mustache.render($locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });

    $messages.insertAdjacentHTML('beforeend', html);
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disable the button for a moment when sending message
    $messageFormButton.disabled = true;
    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        // Enable the button when message is sent
        $messageFormButton.disabled = false;

        // Clear the input when message is sent and focus again to the input
        $messageFormInput.value = '';
        $messageFormInput.focus();


        if(error){
            return console.log(error);
        }
        console.log('Message delivered!');
    });
})

$sendLocationButton.addEventListener('click', () => {


    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser');
    }

    // Disable the button while fetching the location\
    $sendLocationButton.disabled = true;

    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {

            // Enable the button when location is fetched
            $sendLocationButton.disabled = false;
            console.log('Location Shared');
            
        });
    })

})
socket.emit('join', {username, room}, (error) => {
   
    if(error){
        alert(error);
        location.href = '/' // sending back to the join page
    }
   
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {

        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html;
})
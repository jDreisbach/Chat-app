const socket = io();

//elements
const $messageForm = document.querySelector('#messageForm');
const $messageFormInput=document.querySelector('input');
const $messageFormButton=document.querySelector('button');
const $locationButton=document.querySelector('#shareLoc');
const $messages = document.querySelector('#messages');
const $locationMessages=document.querySelector('#locationMessages');

//Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML;
const locationTemplate = document.querySelector('#locationTemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML;

//Options
const {username, room}= Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild;

    //height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message)=>{
    console.log(message);
    const html= Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
        });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
    });

    socket.on('locationMessage', (url)=>{
        console.log(url);
        const html=Mustache.render(locationTemplate, {
            username: url.username,
            url: url.url,
            createdAt: moment(url.createdAt).format('h:mm A')
        });
        $messages.insertAdjacentHTML('beforeend', html);
        autoscroll();
    });

socket.on('roomData', ({ room, users })=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('send', message, (error)=>{
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value='';
        $messageFormInput.focus();
        if(error){
            console.log(error);
        }

        console.log('Message Delivered');
    });
    
});

$locationButton.addEventListener('click', ()=>{
    if(!navigator.geolocation){
        return alert('Location sharing is not supported by your browser. Try switching to a different browser');
    }

    $locationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
            socket.emit('location', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
        }, ()=>{
            $locationButton.removeAttribute('disabled');
            console.log('Location Shared');
        });
        
    });
});

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error);
        location.href = '/';
    }
});

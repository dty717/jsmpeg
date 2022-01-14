
JSMpeg.Source.RTC = (function () {
	"use strict";

	var RTCSource = function (myPeerConnection, options) {
		this.myPeerConnection = myPeerConnection;
		this.options = options;
		this.socket = null;
		this.streaming = true;
		this.callbacks = { connect: [], data: [] };
		this.destination = null;

		this.reconnectInterval = options.reconnectInterval !== undefined
			? options.reconnectInterval
			: 5;
		this.shouldAttemptReconnect = !!this.reconnectInterval;

		this.completed = false;
		this.established = false;
		this.progress = 0;

		this.reconnectTimeoutId = 0;

		this.onEstablishedCallback = options.onSourceEstablished;
		this.onCompletedCallback = options.onSourceCompleted; // Never used

		this.myPeerConnection.ondatachannel = ((event) => {
			receiveChannel = event.channel;
			receiveChannel.onmessage = this.handleReceiveMessage;
			receiveChannel.onopen = this.handleReceiveChannelStatusChange;
			receiveChannel.onclose = this.handleReceiveChannelStatusChange;
		}).bind(this);
	};
	RTCSource.prototype.handleReceiveMessage = function (event) {
		console.log('handleReceiveMessage',event.data,this.destination.write);
	};
	
	RTCSource.prototype.handleReceiveChannelStatusChange = function (...abc) {
		console.log(abc);
		// if (receiveChannel) {
		// 	console.log("Receive channel's status has changed to " +
		// 		receiveChannel.readyState);
		// }	
		// Here you would do stuff that needs to be done
		// when the channel's status changes
	};

	RTCSource.prototype.connect = function (destination) {
		this.destination = destination;
	};

	RTCSource.prototype.destroy = function () {
		clearTimeout(this.reconnectTimeoutId);
		this.shouldAttemptReconnect = false;
		this.socket.close();
	};

	RTCSource.prototype.start = function () {
		this.shouldAttemptReconnect = !!this.reconnectInterval;
		this.progress = 0;
		this.established = false;

		this.socket = {};//new WebSocket(this.url, this.options.protocols || null);
		this.socket.binaryType = 'arraybuffer';
		this.socket.onmessage = this.onMessage.bind(this);
		this.socket.onopen = this.onOpen.bind(this);
		this.socket.onerror = this.onClose.bind(this);
		this.socket.onclose = this.onClose.bind(this);
	};

	RTCSource.prototype.resume = function (secondsHeadroom) {
		// Nothing to do here
	};

	RTCSource.prototype.onOpen = function () {
		this.progress = 1;
	};

	RTCSource.prototype.onClose = function () {
		if (this.shouldAttemptReconnect) {
			clearTimeout(this.reconnectTimeoutId);
			this.reconnectTimeoutId = setTimeout(function () {
				this.start();
			}.bind(this), this.reconnectInterval * 1000);
		}
	};

	RTCSource.prototype.onMessage = function (ev) {
		var isFirstChunk = !this.established;
		this.established = true;

		if (isFirstChunk && this.onEstablishedCallback) {
			this.onEstablishedCallback(this);
		}

		if (this.destination) {
			this.destination.write(ev.data);
		}
	};

	return RTCSource;

})();


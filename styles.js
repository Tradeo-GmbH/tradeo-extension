var eventInput = new Event('input', { bubbles: true })
var eventChange = new Event('change', { bubbles: true })

var styles = `
/* The switch - the box around the slider */
.switch {
	position: relative;
	display: inline-block;
	width: 36px;
	height: 36px;
}

/* Hide default HTML checkbox */
.switch input {display: none;}

/* The slider */
.slider {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #f11539;// "rot"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider2 {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #de56e8;// "lila"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider2:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider3 {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #73e600;// "limettengrün"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider3:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider4 {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #ffe258;// "gelb angebotsnachfassung"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider4:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider5 {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #feafb1;// "rot storno vorstufe"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider5:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider6 {
	position: absolute;
	cursor: pointer;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: #108be3;// "help scout blau"
	-webkit-transition: .0s;
	transition: .0s;
}

.slider6:before {
	position: absolute;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
	-webkit-transition: .0s;
	transition: .0s;
}

.hvr {
	position: absolute;
	cursor: pointer;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #55575E;// "grey background"
}

.hvr:hover {
	position: absolute;
	cursor: pointer;
	content: "";
	height: 32px;
	width: 36px;
	left: 0px;
	top: 0px;
	background-color: #24b3e0;
}

input:checked + .slider {
	background-color: #6ad26a;// "green"
}

input:checked + .slider:before {
	-webkit-transform: translateX(0px);
	-ms-transform: translateX(0px);
	transform: translateX(0px);
}
`
var styleSheet = document.createElement("style")
styleSheet.innerText = styles
styleSheet.setAttribute("id","tradeoExtensionStyleSheet")
document.head.appendChild(styleSheet)

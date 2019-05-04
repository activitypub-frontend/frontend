let ua = window.navigator.userAgent.toLowerCase();
if ((ua.match(/firefox\/(\d+)/) && Number(ua.match(/firefox\/(\d+)/)[1]) < 66) || (ua.match(/edge\/(\d+)/) && Number(ua.match(/edge\/(\d+)/)[1]) < 19) || /msie|trident/.test(ua) || (ua.match(/chrome\/(\d+)/) && Number(ua.match(/chrome\/(\d+)/)[1]) < 63))
{
	document.getElementsByTagName('body')[0].innerHTML = '<p>This browser is not supported.</p>';
}

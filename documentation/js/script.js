var italicise = function(data) {
	data = data.replace(/MASK/g,'<span class="italic">mask</span>');
	data = data.replace(/SPRITEOBJECT/g,'<span class="italic">spriteObject</span>');
	data = data.replace(/SOUNDOBJECT/g,'<span class="italic">soundObject</span>');
	data = data.replace(/ALARMOBJECT/g,'<span class="italic">alarmObject</span>');
	data = data.replace(/OBJECT/g,'<span class="italic">object</span>');
	
	return data;
};

$('div.title').each(function() {
	$this = $(this);	
	$this.html(italicise($this.html()));
});

$('#navmenu').tree();

$('#sidebarButton').toggle(function() {
	$('#sidebarButton').css('background-image',"url('images/show.png')");
	
	$('#content').animate({
		marginLeft: '25px'
	},'slow');
},function() {
	$('#sidebarButton').css('background-image',"url('images/hide.png')");
	
	$('#content').animate({
		marginLeft: '225px'
	},'slow');
});

$('#sidebarButton').click(function() {
	$('#sidebar').animate({
		width: 'toggle',
	},'slow');
});

var hashstate;

var loadPage = function(url) {
	$.get('pages/'+url+'.html',function(data) {
		data = italicise(data);
		
		$('#content').html(data);
		$('#content .readonly').prepend('<div class="italic">This property is read only</div><br />');
		$('#content .usage').prepend('<h3>Usage:</h3>');
		$('#content .parameters').prepend('<h3>Parameters:</h3>');
		$('#content .property').prepend('<h3>Property:</h3>');
		$('#content .return').prepend('<h3>Return:</h3>');
		$('#content .example').prepend('<h3>Examples:</h3>');
		SyntaxHighlighter.highlight();
		
		hashstate = '#'+url;
		window.location.hash = url;
	});
};

if (window.location.hash !== '') {
	loadPage(window.location.hash.replace('#',''));
} else {
	loadPage('The_Global_Object');
}

window.onhashchange = function() {
	if (hashstate !== window.location.hash) {
		loadPage(window.location.hash.replace('#',''));
	}
};
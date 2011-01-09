(function($){
	$.fn.tree = function() {
		this.find('li:not(.item)').each(function() {
			var $this,$menu,$title;
			
			$this = $(this);
			$this.addClass('submenu');
			$title = $this.children('div.title:first');
			$menu = $this.children('ul:first');
			$menu.hide();
			$title.click(function() {
				$menu.slideToggle('fast');
			});
		});
	};
})(jQuery);
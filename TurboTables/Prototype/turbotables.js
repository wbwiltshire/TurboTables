$(document).ready(function () {
	var filterRow = document.getElementById('filterrow');
	
	 $('#filter').click(function () {
		if (filterRow.style.display === 'none') 
			filterRow.style.display = '';
		else
			filterRow.style.display = 'none';
     });
});
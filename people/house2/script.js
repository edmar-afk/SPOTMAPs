var tested = 0;

$(function () { 
    $('#container').highcharts({
        colors: ['#2ecc71', '#e74c3c', '#3498db', '#9b59b6', '#f1c40f'],
        
        chart: {
            type: 'bar',
            backgroundColor: 'rgba(236, 240, 241, 0)'
        },
        title: {
            text: 'People in Purok 6'
        },
        xAxis: {
            categories: ['2010', '2011', '2013', '2016']
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        series: [{
            name: 'Old(60-100)',
            data: [405, 404, 401, 396]
        }, 
        {
            name: 'Young(0-59)',
            data: [602, 620, 640, 650]
        }, 
        {
            name: 'Male',
            data: [2029, 2100, 2200, 2300]
        },
        {
            name: 'Female',
            data: [2200, 2300, 2400, 2450]
        }, 
        
        ]
    });
});


$(".codepen-comment").click(function(){
    if (tested===0){
        html = "<div class='media'>\
                        <a class='pull-left' href='#'>\
                            <img class='media-object' src='http://placehold.it/72.png/e74c3c/fff' alt='Media Object'>\
                        </a>\
                        <div class='media-body'>\
                            <h4 class='media-heading'>It's you! <span class='badge'>CodePen User</span></h4>\
                            <p>Check this out, click on the add comment button below!</p>\
                            <p><span class='add-comment codepen-comment'><span class='glyphicon glyphicon-plus' aria-hidden='true'></span> Add comment</span></p>\
                        </div>\
                    </div>";
        $(".codepen-target").append(html);
        tested=1;
    }
});
/**
 * A module which exposes a way to update global settings
 * @module app/settingswidget
 */
define(["jquery", "app/widget", "moment", "jquery-ui", "app/utils"],
function(jquery, Widget, moment, jqueryui, utils){
    "use strict"

    /**
     * Type which defines the settings widget
     * @alias module:app/settingswidget
     *
     * @param {DOM Element} elem - The element to fill with this widget
     */
    var SettingsWidget = function(elem, widgets) {
        this.body = $("<div>");
        this.widgets = widgets;
        this.body.load("bodies/settings.html",
                       null,
                       this.onAdded.bind(this));
        elem.prepend(this.body);
        this.body.show();
    }

    SettingsWidget.prototype.onAdded = function() {
        $("#settings-raise-percent").change(function(){
            _.map(this.widgets, function(widget){
                if (widget.update)
                    widget.update();
            });
        }.bind(this));

        $("#settings-project-type").change(function(){
            $("#settings-indirect-cost-rate").val($(this).val());
        });

        $("#settings-start-date, #settings-end-date").change(function(){
            this.update();
        }.bind(this));

        $("#settings-start-date, #settings-end-date").datepicker({
            changeMonth: true,
            changeYear: true,
        });

        $("#continue-button").click(function(){
            var empty = this.body.find("input").filter(function() {
                return this.value === "";
            });

            if (empty.length) {
                var alert = '<div id="error-alert" class="alert alert-info alert-dismissible" role="alert">' +
                  '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                   '<span aria-hidden="true">&times;</span>' +
                  '</button>' +
                  '<strong>Error  </strong><span class="message">Please fill out all of the forms before continuing.</span>' +
                '</div>';
                var elem = $($.parseHTML(alert));
                elem.insertBefore(".container");
                return;
            }

            for (var key in this.widgets) {
                if (this.widgets[key].body) {
                    this.widgets[key].body.find(".row:first").show();
                }
            }
            this.totals.body.find(".row:first").show();
            $("#continue-button").remove();
        }.bind(this));
    }

    SettingsWidget.prototype.update = function() {
        _.map(this.widgets, function(widget, name){
            var start = $("#settings-start-date").val();
            var end = $("#settings-end-date").val()
            if (!start || !end) {
                return;
            }
            if (widget.updateDuration) {
                widget.updateDuration(moment(start), moment(end));
            }
        });
    }

    SettingsWidget.prototype.save = function() {
        return {
            "title" : $("#settings-title").val(),
            "author" : $("#settings-author").val(),
            "start-date" : $("#settings-start-date").val(),
            "end-date" : $("#settings-end-date").val(),
            "raise-percent" : $("#settings-raise-percent").val(),
            "indirect-cost-rate" : $("#settings-indirect-cost-rate").val(),
            "project-type" : $("#settings-project-type").val()
        };
    }

    SettingsWidget.prototype.restore = function(config) {
        $("#settings-title").val(config["title"]);
        $("#settings-author").val(config["author"]);
        $("#settings-start-date").val(config["start-date"]);
        $("#settings-end-date").val(config["end-date"]);
        $("#settings-raise-percent").val(config["raise-percent"]);
        $("#settings-indirect-cost-rate").val(config["indirect-cost-rate"]);
        $("#settings-project-type").val(config["project-type"]);
        this.update();
    }

    SettingsWidget.prototype.monthsOfYearWorked = function(i) {
        var start = moment($("#settings-start-date").val());
        var end = moment($("#settings-end-date").val());

        var totalRange = moment().range(start.clone(), end.clone());
        var yearStart = start.clone();
        yearStart.add(i, "year");
        yearStart.startOf('year');

        var yearEnd = start.clone();
        yearEnd.add(i, "year");
        yearEnd.endOf('year');

        var yearRange = moment().range(yearStart, yearEnd);
        var intersection = yearRange.intersect(totalRange);
        intersection.end.add(15, "days");
        return intersection.diff("months");
    }

    SettingsWidget.prototype.serialize = function(formatter) {
        var start = $("#settings-start-date").val();
        var end = $("#settings-end-date").val()
        if (!start || !end) {
            return;
        }
        start = moment(start);
        end = moment(end);

        var serialized = [
            [{value: "Title:" + $("#settings-title").val(), metadata: {style: formatter.id}}],
            [{value: "Budget for the period from " + start.format("MMMM Do YYYY")
              + " to " + end.format("MMMM Do YYYY"), metadata: {style: formatter.id}}],
            [{value: $("#settings-raise-percent").val() + "% raise factor in effect",
              metadata: {style: formatter.id}}],
            [""]
        ];

        var yearLine = [
            "", "", "", ""
        ];

        for (var i=0; i < (end.year() - start.year()+1); ++i) {
            yearLine.push("Year " + (start.year() + i));
        }

        yearLine.push("Total");
        serialized.push(yearLine);

        var monthsLine = [
            "", "", "", ""
        ];
        for (var i=0; i < (end.year() - start.year()+1); ++i) {
            monthsLine.push(this.monthsOfYearWorked(i) + " Months");
        }

        serialized.push(monthsLine);

        return serialized;
    }

    return SettingsWidget;
});

import {Component, Input} from "@angular/core";
import "./countdown-timer.component.scss";

@Component({
    selector: 'countdown-timer',
    templateUrl: './countdown-timer.component.html',
})
export class CountdownTimerComponent {
    @Input()
    public enabled: boolean;

    @Input()
    public time: Number;

}

import {SocketService} from "../services/socket.service";
import {Router} from "@angular/router";
import {IErrorResponse} from "../util/app.Interfaces";

export abstract class BaseConnectToRoomComponent {
    public nickname: String;

    constructor(public router: Router, public socket: SocketService) {
        socket.connect()
            .on('serverError', (resp: IErrorResponse) => {
                alert(resp.message);
            });

        this.subscribe();
    }

    public onEnterPressed(event: KeyboardEvent) {
        if (event.keyCode !== 13) {
            return;
        }

        if (this.nickname && this.nickname.length > 0) {
            this.doOnEnterPressed();
        }
    }

    protected abstract doOnEnterPressed():void;

    protected abstract subscribe():void;
}

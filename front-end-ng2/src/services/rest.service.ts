import {Http} from "@angular/http";
import {SERVER_URL} from "../util/config.util";
import {Injectable} from "@angular/core";

@Injectable()
export default class RestService {

    constructor(private http: Http) {
    }

    getPlayer(id: String) {
        return this.http.get(`${SERVER_URL}/player/${id}`).map(resp => resp.json());
    }
}
import {Injectable} from "@angular/core";

@Injectable()
export class LocalStorageService {
    private _storage: Storage;

    constructor() {
        this._storage = localStorage;
    }

    public getObject(key: string): any {
        let str = localStorage.getItem(key);

        return JSON.parse(str);
    }

    public setObject(key: string, object: any) {
        let strObj = JSON.stringify(object);

        localStorage.setItem(key, strObj);
    }
}

import {Component} from "@angular/core";
import {NavController, ToastController} from "ionic-angular";
import {Observable} from "rxjs";
import {Http} from "@angular/http";
import {iChargerService} from "../../services/icharger.service";
import {NgRedux, select} from "@angular-redux/store";
import {IAppState} from "../../models/state/configure";
import {Channel} from "../../models/channel";
import {ConfigPage} from "../config/config-page";
import {UIActions} from "../../models/state/actions/ui";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    @select('ui.exception') exception$: Observable<any>;
    @select('charger') charger$: Observable<Channel>;
    @select('config') config$: Observable<Channel>;

    timeoutUp: boolean;
    showConfigureButton: boolean;

    constructor(public readonly navCtrl: NavController,
                public readonly chargerService: iChargerService,
                private uiAction: UIActions,
                public readonly ngRedux: NgRedux<IAppState>,
                public readonly http: Http) {

        let timeout = 2000;
        this.timeoutUp = false;
        this.showConfigureButton = false;

        Observable.timer(timeout).subscribe(r => {
            this.timeoutUp = true;
        });

        Observable.timer(timeout * 2).subscribe(r => {
            this.showConfigureButton = true;
        })
    }

    anyNetworkOrConnectivityProblems() {
        return this.chargerService.anyNetworkOrConnectivityProblems();
    }

    isNetworkAvailable(): boolean {
        return this.chargerService.isNetworkAvailable();
    }

    isConnectedToServer() {
        return this.chargerService.isConnectedToServer();
    }

    isConnectedToCharger() {
        return this.chargerService.isConnectedToCharger();
    }

    ionViewWillEnter() {
        // this.showConfigPage();
    }

    showConfigPage() {
        this.navCtrl.push(ConfigPage);
    }

    makeError() {
        this.uiAction.setErrorMessage("BOOM");
        this.uiAction.setDisconnected();
    }

    chargerText() {
        if (this.isConnectedToCharger()) {
            return "Charger OK!";
        }
        return "Can't see the charger";
    }

    serverText() {
        if (this.isConnectedToServer()) {
            return "Server/Pi connection is good!";
        }
        return "Can't see the Pi";
    }

    tips() {
        let tips = [];
        if (!this.isNetworkAvailable()) {
            tips.push("Is Wifi on? There doesn't seem to be a network.");
        }
        if (!this.isConnectedToServer()) {
            tips.push("Check that you have the correct host URL in your Configuration.");
            tips.push("Do you have network connectivity to the Pi?");
        }
        if (!this.isConnectedToCharger()) {
            tips.push("Is the charger on?");
            tips.push("Is the charger USB plugged into the Pi?");
        }
        return tips;
    }
}

import {NgModule, ErrorHandler, APP_INITIALIZER} from "@angular/core";
import {Storage} from "@ionic/storage";
import {IonicApp, IonicModule, IonicErrorHandler} from "ionic-angular";
import {MyApp} from "./app.component";
import {HomePage} from "../pages/home/home";
import {KeysPipe, ReversePipe, DurationPipe} from "../utils/pipes";
import {iChargerService} from "../services/icharger.service";
import {Configuration} from "../services/configuration.service";
import {ConfigPage} from "../pages/config/config";
import {ChannelComponent} from "../components/channel/channel";
import {ChargerStatusComponent} from "../components/charger-status/charger-status";
import {PresetListPage} from "../pages/preset-list/preset-list";
import {PresetPage} from "../pages/preset/preset";
import {PresetChargePage} from "../pages/preset-charge/preset-charge";

function configServiceFactory(config: Configuration) {
    return () => config.loadConfiguration();
}

@NgModule({
    declarations: [
        MyApp,
        ConfigPage,
        HomePage,
        KeysPipe, ReversePipe, DurationPipe,
        ChannelComponent,
        PresetListPage,
        PresetPage,
        PresetChargePage,
        ChargerStatusComponent
    ],
    imports: [
        IonicModule.forRoot(MyApp)
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        ConfigPage,
        PresetListPage,
        PresetPage,
        PresetChargePage,
        ChannelComponent
    ],
    providers: [
        Configuration,
        {
            provide: APP_INITIALIZER,
            useFactory: configServiceFactory,
            deps: [Configuration],
            multi: true
        },
        Storage,
        {provide: iChargerService, useClass: iChargerService},
        {provide: ErrorHandler, useClass: IonicErrorHandler}
    ]
})
export class AppModule {
}

import { HiFiCommunicator, HiFiConnectionStates } from "../../src/classes/HiFiCommunicator";

export class TestUser {
    name: string;
    communicator: HiFiCommunicator;
    connectionState: HiFiConnectionStates;

    constructor(name: string) {
        this.name = name;
        this.connectionState = HiFiConnectionStates.Disconnected;
    }

    onConnectionStateChanged(newConnectionState: HiFiConnectionStates) {
        console.log("-> In onConnectionStateChanged: " + this.name + " state changed: " + newConnectionState);
        this.connectionState = newConnectionState;
    }

    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

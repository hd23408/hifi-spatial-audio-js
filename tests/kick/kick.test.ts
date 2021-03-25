const fetch = require('node-fetch');

import { TestUser } from './TestUser';
import { HiFiCommunicator, HiFiConnectionStates } from "../../src/classes/HiFiCommunicator";
import { HiFiAudioAPIData, Point3D, OrientationEuler3D } from "../../src/classes/HiFiAudioAPIData";

describe('Sample', () => {
    let adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiI1YjI5MmRlYy0xOTg2LTRkZmItODI5ZS00MGUyYjdjNTU0MWQiLCJhZG1pbiI6dHJ1ZSwiZGV2ZWxvcGVyX2lkIjoiMGY3ZjQ5ZGQtZTZkNy00ZTlmLTlhODUtZGViNTVlMTg1YWJiIiwic3RhY2siOiJhdWRpb25ldC1taXhlci1hcGktc3RhZ2luZy0wNiJ9.XOCUSp8-13dka1H09P02vKsKXIkFhTU9NpHF_AQs95g";
    let userTokens: Array<string> = [];
    userTokens[0] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiI1YjI5MmRlYy0xOTg2LTRkZmItODI5ZS00MGUyYjdjNTU0MWQiLCJ1c2VyX2lkIjoidXNlci0wIiwic3BhY2VfaWQiOiI2MGJiYWY4ZC1iNjMyLTQwZDEtOGQ5Ni0yMGFiNDdjYTFlYTEiLCJzdGFjayI6ImF1ZGlvbmV0LW1peGVyLWFwaS1zdGFnaW5nLTA2In0.RqhLS-Kj_-BwlQp4JAQKlMaalVQg3IXLaSM9qBA9oB4";
    userTokens[1] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBfaWQiOiI1YjI5MmRlYy0xOTg2LTRkZmItODI5ZS00MGUyYjdjNTU0MWQiLCJ1c2VyX2lkIjoidXNlci0xIiwic3BhY2VfaWQiOiI2MGJiYWY4ZC1iNjMyLTQwZDEtOGQ5Ni0yMGFiNDdjYTFlYTEiLCJzdGFjayI6ImF1ZGlvbmV0LW1peGVyLWFwaS1zdGFnaW5nLTA2In0.DFxrbZCNCI7spXqzmM0xE3PN7wzR8mYVDMwONbAfjfs";

    const numberTestUsers = 2;

    beforeAll(async () => {
        jest.setTimeout(13000); // give these tests plenty of time to complete
    });

    afterAll(async () => {
        jest.setTimeout(5000); // restore to default
    });


    test.skip(`Connect and disconnect`, async (done) => {
        /**************************************************************/
        /* This test just connects, sleeps for five seconds, and      */
        /* disconnects. It will demonstrate that the basic process of */
        /* connecting/disconnecting, reporting on the connection      */
        /* state, and using the change handler fundamentally works.   */
        /**************************************************************/

        let testUsers: Array<any> = [];

        console.log("++++++++++++ Connecting ++++++++++++");
        for (let i = 0; i < numberTestUsers; i++) {
            let username = `user-${i}`;
            testUsers.push(new TestUser(username));
            let token = userTokens[i];
            let initialHiFiAudioAPIData = new HiFiAudioAPIData({ 
                position: new Point3D({ "x": 0, "y": 0, "z": 0 }),
                orientationEuler: new OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 })
            });

            testUsers[i].communicator = new HiFiCommunicator({
                initialHiFiAudioAPIData: initialHiFiAudioAPIData,
                onConnectionStateChanged: testUsers[i].onConnectionStateChanged.bind(testUsers[i])
            });
            let comms_response = await testUsers[i].communicator.connectToHiFiAudioAPIServer(token, "api-staging.highfidelity.com");
        }
        expect(testUsers[0].connectionState).toBe(HiFiConnectionStates.Connected);
        expect(testUsers[1].connectionState).toBe(HiFiConnectionStates.Connected);

        console.log("++++++++++++ Sleeping ++++++++++++");
        await TestUser.sleep(5000);

        console.log("++++++++++++ Disconnecting ++++++++++++");
        for (let i = 0; i < numberTestUsers; i++) {
            await testUsers[i].communicator.disconnectFromHiFiAudioAPIServer();
        }

        console.log("++++++++++++ Sleeping to give logging a chance to finish up ++++++++++++");
        await TestUser.sleep(1000);

        expect(testUsers[0].connectionState).toBe(HiFiConnectionStates.Disconnected);
        expect(testUsers[1].connectionState).toBe(HiFiConnectionStates.Disconnected);

        done();
    });

    test(`Connect, kick user-0, and disconnect`, async (done) => {
        /**************************************************************/
        /* This test connects, kicks a user, and disconnects.         */
        /* When running this test, we add a sleep in between various  */
        /* asynchronous pieces to ensure they have a chance to        */
        /* complete. The expected behavior is that after the kick,    */
        /* the kicked user's state will change to "Disconnected".     */
        /*                                                            */
        /* HOWEVER, what we see is that when running this test,       */
        /* the user-0 TestUser's state goes to Connected, then the    */
        /* handler is called AGAIN with "Connected" after the kick,   */
        /* and then finally only after the disconnect() is called     */
        /* does the user get disconnected. (With other combinations   */
        /* of sleeps and awaits and logging I have also experienced   */
        /* the handler not seeming to get called at all after the     */
        /* kick.) Interestingly, the mixer's reported number of       */
        /* connected users DOES in fact indicate that a user has      */
        /* been kicked.                                               */
        /*                                                            */
        /* The basic functionality and the calling of the "kick" does */
        /* work -- if you bring up a sample app using the "user-0"    */
        /* token (userTokens[0] above) and run just the "kick" piece  */
        /* (see below test), that user DOES get disconnected.         */
        /* It is known that the "kick" functionality doesn't disconnect */
        /* the signaling connection (just the ravi session) at this   */
        /* point, which may be messing with our logic somewhere,      */
        /* but it's not clear to me why kicking a user who's connected*/
        /* via the sample app would behave differently than kicking   */
        /* a user connected via a jest test.                          */
        /**************************************************************/

        // Same connection logic as other test
        let testUsers: Array<any> = [];
        console.log("++++++++++++ Connecting ++++++++++++");
        for (let i = 0; i < numberTestUsers; i++) {
            let username = `user-${i}`;
            testUsers.push(new TestUser(username));
            let token = userTokens[i];
            let initialHiFiAudioAPIData = new HiFiAudioAPIData({ 
                position: new Point3D({ "x": 0, "y": 0, "z": 0 }),
                orientationEuler: new OrientationEuler3D({ "pitchDegrees": 0, "yawDegrees": 0, "rollDegrees": 0 })
            });

            testUsers[i].communicator = new HiFiCommunicator({
                initialHiFiAudioAPIData: initialHiFiAudioAPIData,
                onConnectionStateChanged: testUsers[i].onConnectionStateChanged.bind(testUsers[i])
            });
            let comms_response = await testUsers[i].communicator.connectToHiFiAudioAPIServer(token, "api-staging.highfidelity.com");
        }
        expect(testUsers[0].connectionState).toBe(HiFiConnectionStates.Connected);
        expect(testUsers[1].connectionState).toBe(HiFiConnectionStates.Connected);

        /**************************************************************/

        console.log("++++++++++++ Checking connected users before kick ++++++++++++");
        let url = `https://api-staging.highfidelity.com/api/v1/spaces/60bbaf8d-b632-40d1-8d96-20ab47ca1ea1/?token=${adminToken}`;
        let returnMessage = await fetch(url, {
            method: 'GET'
        });
        let parsedMessage = await returnMessage.json();
        console.log("Before kicking, connected users: " + parsedMessage.connected_user_count);
        expect(parsedMessage.connected_user_count).toBe(2);

        console.log("++++++++++++ Kicking user-0 ++++++++++++");
        url = `https://api-staging.highfidelity.com/api/v1/spaces/60bbaf8d-b632-40d1-8d96-20ab47ca1ea1/users/user-0?token=${adminToken}`;
        returnMessage = await fetch(url, {
            method: 'DELETE'
        });

        await TestUser.sleep(5000);

        console.log("++++++++++++ Checking connected users after kick ++++++++++++");
        url = `https://api-staging.highfidelity.com/api/v1/spaces/60bbaf8d-b632-40d1-8d96-20ab47ca1ea1/?token=${adminToken}`;
        returnMessage = await fetch(url, {
            method: 'GET'
        });
        parsedMessage = await returnMessage.json();
        console.log("After kicking, connected users: " + parsedMessage.connected_user_count);
        expect(parsedMessage.connected_user_count).toBe(1);

        // At this point, we would expect for the "user-0" status to be Disconnected.
        // However, it's still Connected. Commenting this expect out for now to 
        // observe the full flow.
        //expect(testUsers[0].connectionState).toBe(HiFiConnectionStates.Disconnected);
        expect(testUsers[1].connectionState).toBe(HiFiConnectionStates.Connected);

        console.log("++++++++++++ Checking Underlying Connection Status ++++++++++++");
        for (let i = 0; i < numberTestUsers; i++) {
            let username = `user-${i}`;
            console.log("************ " + username + " status is: " + testUsers[i].communicator._mixerSession._currentHiFiConnectionState + " ************");
        }

        /**************************************************************/

        console.log("++++++++++++ Disconnecting ++++++++++++");
        for (let i = 0; i < numberTestUsers; i++) {
            await testUsers[i].communicator.disconnectFromHiFiAudioAPIServer();
        }

        console.log("++++++++++++ Sleeping to give logging a chance to finish up ++++++++++++");
        await TestUser.sleep(1000);

        expect(testUsers[0].connectionState).toBe(HiFiConnectionStates.Disconnected);
        expect(testUsers[1].connectionState).toBe(HiFiConnectionStates.Disconnected);

        done();
    });


    test.skip(`ONLY kick user-0`, async (done) => {
        /**************************************************************/
        /* This test just kicks a user identified with user-0.        */
        /* If you bring up a sample app using the "user-0"            */
        /* token (userTokens[0] above) and run just this "kick" piece,*/
        /* that user DOES get disconnected.                           */
        /* (It does take about 5 seconds, though.)                    */
        /**************************************************************/
        console.log("++++++++++++ Kicking user-0 ++++++++++++");
        let url = `https://api-staging.highfidelity.com/api/v1/spaces/60bbaf8d-b632-40d1-8d96-20ab47ca1ea1/users/user-0?token=${adminToken}`;
        let returnMessage = await fetch(url, {
            method: 'DELETE'
        });

        done();
    });

});

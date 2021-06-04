import { ipcRenderer as ipc} from 'electron'
let $ = require('jquery');

$(() => {
    $('#btnCenterState').click(() => {
        let stateNum = $('#stateInput')[0].value;

        if(stateNum.length != 3)
            stateNum = '000';

        ipc.send('center-triggerd', stateNum);
        $('#stateInput')[0].value = '';
    });

    $('#btnZoomIn').click(() => {
        ipc.send('zoom-in-triggerd');
    });

    $('#btnZoomOut').click(() => {
        ipc.send('zoom-out-triggerd');
    });
    $('#btnZoomOriginal').click(() => {
        ipc.send('zoom-all-triggerd');
    });
});


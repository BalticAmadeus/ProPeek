import * as React from "react";
import { CommandAction, ICommand, IConfig } from "../model";
import { ISettings } from "../../../common/IExtensionSettings";

interface IConfigProps {
    vscode: any;
    initialData: IConfig;
    configuration: ISettings;
}

interface IConfigState {
    config: IConfig;
}

function ConnectionForm({ vscode, initialData, configuration, ...props }: IConfigProps) {
    const oldState = vscode.getState();
    const initState = oldState ? oldState : { config: initialData };
    const [vsState, _] = React.useState<IConfigState>(initState);

    const [name, setName] = React.useState(vsState.config.name);

    const onSaveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const id: string = "SaveClick";
        const config: IConfig = {
            name: name,
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Save,
            content: config,
        };
        vscode.postMessage(command);
    };

    const onTestClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        const id: string = "TestClick";
        const config: IConfig = {
            name: name,
        };
        const command: ICommand = {
            id: id,
            action: CommandAction.Test,
            content: config,
        };
        vscode.postMessage(command);
    };

    return (
        <React.Fragment>
            <div className="container">
                <div className="title">Connect to server</div>
                <div className="content">
                    <form action="#">
                        <div className="input-box-wide">
                            <input
                                type="text"
                                placeholder="Physical name"
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                }}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );
}

export default ConnectionForm;

import * as React from "react";
import { ISettings } from "../../../common/IExtensionSettings";

interface IConfigProps {
    vscode: any;
    configuration: ISettings;
}

function ConnectionForm({ }: IConfigProps) {

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
                                value={"test"}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );
}

export default ConnectionForm;

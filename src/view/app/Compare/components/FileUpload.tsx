import * as React from 'react';
import { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';

const FileUpload = () => {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file: File = event.target.files?.[0];
            console.log('File selected:', file.path);
            setFileName(file.path);
    };

    const handleClear = () => {
        setFileName(null);
    };

    return (
        <Box>
            <Typography variant="h6">Upload a file</Typography>
            <input
                accept=".out"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
                <Button
                    sx={{ mr: 1 }}
                    variant="contained"
                    component="span"
                    color="primary"
                    size="small"
                    disabled={fileName !== null}
                >
                    Choose File
                </Button>
                <Button variant='outlined' onClick={handleClear}>Clear</Button>
            </label>            
            {fileName && <Typography variant="body1">Selected file: {fileName}</Typography>}
        </Box>
    );
};

export default FileUpload;
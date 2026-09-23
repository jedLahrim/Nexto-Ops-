import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { join } from 'path';

/**
 * Example of Streaming Data to the client.
 * Efficiently sends large files or data sets without loading everything into memory.
 */

@Controller('stream')
export class StreamingController {

    @Get('video')
    streamLargeFile(@Res() res: Response) {
        const filePath = join(__dirname, 'large-asset.mp4');
        const stat = fs.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': stat.size,
        });

        const readStream = fs.createReadStream(filePath);

        // Pipe the stream directly to the response
        readStream.pipe(res);
    }

    @Get('csv')
    streamDynamicData(@Res() res: Response) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=large-export.csv');

        // Simulate generating thousands of rows
        let count = 0;
        const interval = setInterval(() => {
            res.write(`${count},Data Point A,Data Point B\n`);
            count++;
            if (count > 5000) {
                clearInterval(interval);
                res.end();
            }
        }, 1);
    }
}

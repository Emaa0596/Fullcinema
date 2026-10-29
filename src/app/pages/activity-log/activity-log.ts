import { Component, inject, signal } from '@angular/core';
import { ActivityLogService } from '../../services/activity-log.service';

@Component({
    selector:'app-activity-log',
    imports:[],
    templateUrl:'./activity-log.html',
    styleUrl:'./activity-log.css'
})
export class ActivityLog {
    private readonly activityLogService=inject(ActivityLogService);

    readonly logs=signal<any[]>([]);
    readonly loading=signal(true);
    readonly error=signal('');

    constructor(){ this.loadLogs(); }

    async loadLogs() {
        const { data,error }=await this.activityLogService.getLogs();

        if(error){
            this.error.set(error.message);
            this.loading.set(false);
            return;
        }

        this.logs.set(data ?? []);
        this.loading.set(false);
    }
}
import { logManager } from '../log-manager';
import { stateManager } from '../state-manager';
import * as activeWin from 'active-win';
import BackgroundUtils from '../background-utils';
import { backgroundService } from '../background-service';
import { TrackItemType } from '../enums/track-item-type';
import { taskAnalyser } from '../task-analyser';
import { TrackItem } from '../models/TrackItem';

let logger = logManager.getLogger('AppTrackItemJob');

export class AppTrackItemJob {
    lastUpdatedItem: TrackItem;
    async run() {
        try {
            this.checkIfIsInCorrectState();
            let activeWindow = await activeWin();
            let updatedItem: TrackItem = await this.saveActiveWindow(
                activeWindow ? activeWindow : {},
            );

            if (!BackgroundUtils.isSameItems(updatedItem, this.lastUpdatedItem)) {
                logger.debug('App and title changed. Analysing title');
                taskAnalyser.analyseAndNotify(updatedItem).then(
                    () => logger.debug('Analysing has run.'),
                    e => logger.error('Error in Analysing', e),
                );
            }

            this.lastUpdatedItem = updatedItem;
        } catch (error) {
            logger.info('Error activeWin', error.message);
        }
        return true;
    }

    checkIfIsInCorrectState(): void {
        if (stateManager.isSystemSleeping()) {
            throw new Error('System is sleeping.');
        }

        if (stateManager.isSystemIdling()) {
            stateManager.resetAppTrackItem(); // TODO: Check if this is needed
            throw new Error('App is idling.');
        }
    }

    async saveActiveWindow(result): Promise<TrackItem> {
        let rawItem: any = { taskName: TrackItemType.AppTrackItem };

        rawItem.beginDate = BackgroundUtils.currentTimeMinusJobInterval();
        rawItem.endDate = new Date();

        if (!result.app) {
            if (result.owner && result.owner.name) {
                rawItem.app = result.owner.name;
            } else {
                rawItem.app = 'NATIVE';
            }
        } else {
            rawItem.title = result.app;
        }

        if (!result.title) {
            logger.error('rawitem has no title', result);
            rawItem.title = 'NO_TITLE';
        } else {
            rawItem.title = result.title.replace(/\n$/, '').replace(/^\s/, '');
        }

        // logger.debug('Active window (parsed):', rawItem);

        let savedItem = await backgroundService.createOrUpdate(rawItem);
        return savedItem;
    }
}

export const appTrackItemJob = new AppTrackItemJob();

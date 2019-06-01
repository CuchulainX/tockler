import * as React from 'react';
import { TrackItemTable } from './TrackItemTable';
import { TrackItemService } from '../../services/TrackItemService';

export const TrackItemTableContainer = props => {
    const deleteTimelineItems = ids => {
        console.debug('Delete timeline items', ids);

        if (ids) {
            TrackItemService.deleteByIds(ids).then(() => {
                console.debug('Deleted timeline items', ids);
                // TODO: reload timerange or remove from timeline
            });
        } else {
            console.error('No ids, not deleting from DB');
        }
    };

    const moreProps = { deleteTimelineItems };

    return <TrackItemTable {...props} {...moreProps} />;
};

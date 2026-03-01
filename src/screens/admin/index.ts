import StaffListScreen from './StaffListScreen';

export default {
    title: 'Admin',
    component: StaffListScreen,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => {
            return (
                <div style={{
                    position: 'relative',
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'white',
                }}>
                    {Story()}
                </div>
            );
        },
    ],
    stories: [
        'Admin/StaffListScreen',
    ],
};
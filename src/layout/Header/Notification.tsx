import React, { FC, useState } from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../components/bootstrap/Button';
import noNotification from "../../assets/Lottie/notification.json";
import Icon from '../../components/icon/Icon';
import Moments from '../../helpers/Moment';
import { useNavigate } from 'react-router-dom';
import Modal, { ModalBody } from '../../components/bootstrap/Modal';
import {
  selectAllAlerts,
  selectUnreadCount,
  markEventsAsRead
} from '../../store/sensorEventsSlice';
import { Tooltip } from '@mui/material';

const Notifications: FC<any> = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select data from our new Redux slice
  const notifications = useSelector(selectAllAlerts);
  const unreadCount = useSelector(selectUnreadCount);

  const handleNotificationClick = (id?: string) => {
    // Navigate to logs or alerts page if needed
    // navigate(`/alerts/${id}`); 
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Optional: Mark as read when closing the modal
    dispatch(markEventsAsRead());
  };

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      id="notificationDetailModal"
      titleId="notificationDetailModalTitle"
      isPositionRight={true}
      // @ts-ignore
      size="lg"
      isAnimation={true}
      isBackgroundBlur={true}
    >
      <div className='position-absolute top-0 end-0 p-2'>
        <Button
          size='lg'
          onClick={handleClose}
          icon='Close'
        />
      </div>
      <div className='p-2'>

        <div className='d-flex flex-column justify-content-between p-4 pb-0'>
          <div className='m-0 fs-2 fw-semibold'>
            Notifications
            {unreadCount > 0 && (
              <span className="badge bg-danger ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
                {unreadCount} New
              </span>
            )}
          </div>
        </div>

        <ModalBody
          style={{
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '1rem'
          }}
          className='pt-0'
        >
          {notifications.length === 0 ? (
            <div className='text-center'>
              <Player
                autoplay
                loop
                src={noNotification}
                style={{ height: '200px' }}
              />
              <p className='text-muted mt-3'>
                No new alerts
              </p>
            </div>
          ) : (
            <>
              {notifications.map((data: any, index: number) => (
                <div
                  key={index}
                  onClick={() => handleNotificationClick(data.id)}
                  className='cursor-pointer'
                >
                  <div className='d-flex gap-3 align-items-center justify-content-between py-4 border-bottom'>
                    <div className='d-flex gap-3 align-items-center'>
                      <div className='d-flex align-items-center justify-content-center p-3 rounded-circle'
                        style={{ backgroundColor: data.type === 'alert' ? '#ffebeb' : '#EBEBEB' }}
                      >
                        <Icon
                          icon={data.type === 'alert' ? 'NotificationsActive' : 'Notifications'}
                          size='2x'
                          color={data.type === 'alert' ? 'danger' : 'primary'}
                        />
                      </div>
                      <div>
                        <small className='fs-5 fw-bold text-dark'>
                          {data.message || 'New Event'}
                        </small>
                        <p className='mt-1 m-0 text-muted' style={{ fontSize: '12px' }}>
                          Sensor ID: {data.sensor_id || 'Unknown'}
                        </p>
                        <p className='m-0 text-muted' style={{ fontSize: '12px' }}>
                          {data.timestamp ? Moments(data.timestamp, 'relativetime') : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </ModalBody>
      </div>
    </Modal >
  );
};

export default Notifications;
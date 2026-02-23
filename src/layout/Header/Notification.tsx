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
import { getSeverityConfig } from '../../components/alerts/AlertToast';

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
              {notifications.map((data: any, index: number) => {
                const cfg = getSeverityConfig(data);
                return (
                  <div
                    key={index}
                    onClick={() => handleNotificationClick(data.id)}
                    className='cursor-pointer'
                  >
                    <div className='d-flex gap-3 align-items-center justify-content-between py-4 border-bottom'>
                      <div className='d-flex gap-3 align-items-center' style={{ width: '100%' }}>
                        <div className='d-flex align-items-center justify-content-center p-3 rounded-circle'
                          style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33`, minWidth: '50px', height: '50px' }}
                        >
                          <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className='d-flex justify-content-between align-items-start'>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.8px',
                                textTransform: 'uppercase',
                                color: cfg.color,
                                background: cfg.bg,
                                padding: '1px 6px',
                                borderRadius: 4,
                                marginBottom: '4px',
                                display: 'inline-block',
                                border: `1px solid ${cfg.color}22`
                              }}
                            >
                              {cfg.label}
                            </span>
                            <small className='text-muted' style={{ fontSize: '11px' }}>
                              {data.timestamp ? Moments(data.timestamp, 'relativetime') : 'Just now'}
                            </small>
                          </div>
                          <div className='fs-6 fw-bold text-dark' style={{ lineHeight: 1.2 }}>
                            {data.message || 'New Alert Received'}
                          </div>
                          <div className='d-flex gap-2 mt-2 flex-wrap'>
                            {data.sensor_name && (
                              <span className='badge bg-light text-dark border' style={{ fontSize: '10px', fontWeight: 500 }}>
                                <Icon icon='Sensors' size='sm' className='me-1 opacity-50' />
                                {data.sensor_name}
                              </span>
                            )}
                            {data.area_name && (
                              <span className='badge bg-light text-dark border' style={{ fontSize: '10px', fontWeight: 500 }}>
                                <Icon icon='LocationOn' size='sm' className='me-1 opacity-50' />
                                {data.area_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </ModalBody>
      </div>
    </Modal >
  );
};

export default Notifications;
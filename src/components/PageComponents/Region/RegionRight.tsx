import React, { useRef, useState } from 'react'
import Card, { CardActions, CardHeader } from '../../bootstrap/Card'
import Button from '../../bootstrap/Button'
import SubscriptionSettings from './SubscriptionSettings'
import TaxSettings from './TaxSettings'
import Users from './Users'
import AddButton from '../../CustomComponent/Buttons/AddButton'
import AddSubscription from './AddSubscription'
import AddTax from './AddTax'
import AddUser from './AddUser'

const tabOptions = [
    'Subscription Settings',
    'Tax Settings',
    'Users'
]




function RegionRight() {
  const tableRef = useRef(null)
  const pagesOption = {
    'Subscription Settings':<SubscriptionSettings />,
    'Tax Settings' : <TaxSettings/>,
    'Users':<Users tableRef={tableRef} />
    }
    const [activeTab,setActiveTab] = useState('Subscription Settings')
    const [modalShow,setModalShow] = useState(null)
  return (
    <>

    <AddSubscription
    isOpen={modalShow === 'Subscription Settings'}
    setIsOpen={() => setModalShow(null)}
    title='Add Subscription'
    />
    <AddTax
    isOpen={modalShow === 'Tax Settings'}
    setIsOpen={() => setModalShow(null)}
    title='Add Tax'
    />
    <AddUser
    isOpen={modalShow === 'Users'}
    setIsOpen={() => setModalShow(null)}
    title='Add User'
    />

     <Card>
        <CardHeader>
                <div className='bg-light p-2 rounded-3'>
						{tabOptions.map((key) => (
							<Button
								key={key}
								color={activeTab === key ? 'primary' : 'light'}
								onClick={() => setActiveTab(key)}>
								{key}
							</Button>
						))}
					</div>

				<CardActions>
                    <AddButton 
                    name={`Add ${activeTab}`}
                    modalShow={() => setModalShow(activeTab)}
                    />
					
				</CardActions>
                </CardHeader>

                <div className='p-4'>
                {pagesOption[activeTab]}
                </div>
    </Card>
    </>
  )
}

export default RegionRight
import React, { useRef ,useState } from 'react'
import Card, { CardActions, CardBody, CardHeader } from '../../../bootstrap/Card'
import AddButton from '../../../CustomComponent/Buttons/AddButton'
import RolesList from './RolesList'
import AddRole from './AddRole'

function index() {
    const [addModalShow,setAddModalShow] = useState(false)
    const tableRef = useRef(null)
  return (
    <>
    <AddRole isOpen={addModalShow} setIsOpen={setAddModalShow} title='Add Role'/>
    {/* <Card className='p-2'> */}
    <CardHeader className='fw-bold h5'>
        Roles
        <CardActions>
            <AddButton modalShow={setAddModalShow} name='Add Role'/>
        </CardActions>
    </CardHeader>
    <CardBody>
        <RolesList tableRef={tableRef} />
    </CardBody>
    {/* </Card> */}
    </>
  )
}

export default index
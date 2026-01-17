import React, { useRef ,useState } from 'react'
import Card, { CardActions, CardBody, CardHeader } from '../../../bootstrap/Card'
import AddButton from '../../../CustomComponent/Buttons/AddButton'
import ProfileList from './ProfileList'
import AddProfile from './AddProfile'
// import AddProfile from './AddProfile'

function index() {
    const [addModalShow,setAddModalShow] = useState(false)
    const tableRef = useRef(null)
  return (
    <>
    <AddProfile isOpen={addModalShow} setIsOpen={setAddModalShow} title='Create Profile'/>
    {/* <Card className='p-2'> */}
    <CardHeader className='fw-bold h5'>
        Profiles
        <CardActions>
            <AddButton modalShow={setAddModalShow} name='Add Profile'/>
        </CardActions>
    </CardHeader>
    <CardBody>
        <ProfileList tableRef={tableRef} />
    </CardBody>
    {/* </Card> */}
    </>
  )
}

export default index
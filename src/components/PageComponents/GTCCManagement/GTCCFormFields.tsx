import React, { useEffect, useState } from 'react'
import FormGroup from '../../bootstrap/forms/FormGroup'
import ReactSelectComponent from '../../CustomComponent/Select/ReactSelectComponent'
import axios from 'axios'
// import InputWithCharCount from '../../CustomComponent/Fields/InputWithCharCount'
import { authAxios } from '../../../axiosInstance'
import InputWithCharCount from '../../CustomComponent/Fields/InputWithCharCount'


const GTCCFormFields = ({ register, errors, control, getValues, watch }: any) => {

  const [designation, setDesignation] = useState([])
  const [loader, setLoader] = useState(true)


  // useEffect(() => {
  //   const fetchDesignation = async () => {
  //     try {
  //       const response = await authAxios.get('/users/designations?status=Active&is_pagination=false');
  //       console.log(response.data);
  //       setDesignation(response.data.results.map((item: any) => ({
  //         label: item.name,
  //         value: item.id,
  //       })));
  //       setLoader(false);
  //     } catch (error) {
  //       setLoader(false);
  //     }
  //   }
  //   fetchDesignation();
  // }, []);
  return (
    <>
      {/* Establishment Information */}
      <div className='row p-2'>
        <div className='col-12'>
          <FormGroup label="GTCC Name *" >
            <input
              type='text'
              placeholder=''
              className={errors?.name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("name", {
                required: true,
              })}
            />
            {errors?.name?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        <div className='col-12'>
          <FormGroup label="TL No *" >
            <input
              type='text'
              placeholder=''
              className={errors?.trade_license_no?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("trade_license_no", {
                required: true,
              })}
            />
            {errors?.trade_license_no?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        <div className='col-12'>
          <FormGroup label="TL Name *" >
            <input
              type='text'
              placeholder=''
              className={errors?.trade_license_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("trade_license_name", {
                required: true,
              })}
            />
            {errors?.trade_license_name?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        {/* <div className='col-12'>
          <FormGroup label="FoodWatch Business Id" >
            <input
              type='number'
              placeholder=''
              className={errors?.foodwatch_business_id?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("foodwatch_business_id")}
            />
            {errors?.foodwatch_business_id?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        <div className='col-12'>
          <FormGroup label="FoodWatch Id" >
            <input
              type='number'
              placeholder=''
              className={errors?.foodwatch_id?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("foodwatch_id")}
            />
            {errors?.foodwatch_id?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div> */}
       
        <div className='col-12'>
          <FormGroup label="TRN" >
            <input
              type='text'
              placeholder=''
              className={errors?.tax_registration_no?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("tax_registration_no")}
            />
            {errors?.tax_registration_no?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        {/* <div className='col-12'>
          <FormGroup label="Establishment Name *" >
            <input
              type='text'
              placeholder=''
              className={errors?.establishment_name?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("establishment_name", {
                required: true,
              })}
            />
            {errors?.establishment_name?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div> */}


        {/* Address Section */}
        <div className='col-12'>
          <FormGroup label="Address *">
            <input
              type='text'
              className={errors?.address?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("address", {
                required: true,
              })}
            />
            {errors?.address?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>

        {/* Location Section */}
        <div className='col-12 '>
          <FormGroup label="Location *">
            <input
              type='text'
              className={errors?.location?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("location", {
                required: true,
              })}
            />


            {errors?.location?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        <div className='col-12 mb-2'>
          <InputWithCharCount
            label="Remarks "
            type="textarea"
            rows={3}
            maxLength={200}
            value={watch("remarks") || ""}
            placeholder="Remarks"
            error={errors?.remarks}
            register={register("remarks", {
              required: false,
            })}
          />
        </div>
        {/* Contact Person Information */}
        {/* <div className='col-12 mb-2'>
          <FormGroup label="Contact Person *">
            <input
              type='text'
              className={errors?.contact_person?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("contact_person", {
                required: true,
              })}
            />

            {errors?.contact_person?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>

        <div className='col-12 mb-2'>
          <FormGroup label="Contact No *">
            <input
              type='text'
              className={errors?.contact_no?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("contact_no", {
                required: true,
              })}
            />
            {errors?.contact_no?.type === "required" ? (
              <span className="field-required-class">*Required</span>
            ) : <p />}
          </FormGroup>
        </div>
        <div className='col-12 mb-2 '>
          <FormGroup label="Email Id (Contact Person)">
            <input
              type='email'
              className={errors?.email?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("email", {
                required: true,
                pattern:
                  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              })}
            />
            {errors.email?.type === "required" && (
              <span style={{ color: "red" }}>*This field is required</span>
            )}
            {errors.email?.type === "pattern" && (
              <span
                style={{
                  color: "red",
                }}
              >
                Please provide a valid email address
              </span>
            )}
          </FormGroup>
        </div> */}
        {/* <div className='col-12 mb-2'>
          <ReactSelectComponent
            control={control}
            // className={errors?.designation?.type === "required" ? 'form-control is-invalid' : 'form-control'}
            name='Designation(Contact Person) *'
            isMulti={false}
            field_name='designation'
            getValues={getValues}
            errors={errors}
            options={designation}
            isRequired
            isLoading={loader}
          />
        </div> */}

        {/* Additional Information */}
        {/* <div className='col-12'>
          <FormGroup label="Emirate Id">
            <input
              type='text'
              className={errors?.designation?.type === "required" ? 'form-control is-invalid' : 'form-control'}

              {...register("emirate", {
                required: true,
                minLength: 15,
                maxLength: 15,
              })}
            />
            {errors.emirate?.type === "required" && (
              <span style={{ color: "red" }}>*This field is required</span>
            )}
            {errors.emirate?.type === "minLength" && (
              <span
                style={{
                  color: "red",
                }}
              >
                Emirate Id must consist of 15 digits
              </span>
            )}
          </FormGroup>
        </div> */}

        <div className='col-12 mb-2'>
          <FormGroup label="Office Email Id *">
            <input
              type='email'
              className={errors?.office_email?.type === "required" ? 'form-control is-invalid' : 'form-control'}

              // className='form-control'
              {...register("office_email", {
                required: true,
                pattern:
                  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              })}
            />
            {errors.office_email?.type === "required" && (
              <span style={{ color: "red" }}>*This field is required</span>
            )}
            {errors.office_email?.type === "pattern" && (
              <span
                style={{
                  color: "red",
                }}
              >
                Please provide a valid email address
              </span>
            )}
          </FormGroup>
        </div>

        <div className='col-12 mb-2'>
          <FormGroup label="Company Contact No *">
            <input
              type="number"
              // @ts-ignore
              onWheel={(e:any) => e.target.blur()}
              // @ts-ignore
              onInput={(e:any) => e.target.value = e.target.value.slice(0, 10)}
              className={errors?.company_contact_no?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("company_contact_no", {
                required: true,
              })}
            />
            {errors.company_contact_no?.type === "required" && (
              <span style={{ color: "red" }}>*This field is required</span>
            )}
          </FormGroup>
        </div>

        <div className='col-12 mb-2'>
          <FormGroup label="PO Box *">
            <input
              type='text'
              className={errors?.po_box?.type === "required" ? 'form-control is-invalid' : 'form-control'}
              {...register("po_box", {
                required: true,
              })}
            />
            {errors.po_box?.type === "required" && (
              <span style={{ color: "red" }}>*This field is required</span>
            )}
          </FormGroup>
        </div>

       
      </div>


    </>
  )
}

export default GTCCFormFields
this is doc 



EffectComposer

The EffectComposer must wrap all your effects. It will manage them for you.

<EffectComposer
  enabled?: boolean
  depthBuffer?: boolean
  enableNormalPass?: boolean
  stencilBuffer?: boolean
  autoClear?: boolean
  multisampling?: number
  frameBufferType?: TextureDataType
  /** For effects that support DepthDownsamplingPass */
  resolutionScale?: number
  renderPriority?: number
  camera?: THREE.Camera
  scene?: THREE.Scene
>
{/* your effects go here */}
</EffectComposer>

Selection - React Postprocessing

React Postprocessing.docs

Search for anythingPress/to search

Selection

Selection/Select

Some effects, like Outline or SelectiveBloom can select specific objects. To manage this in a declarative scene with just references can be messy, especially when things have to be grouped. These two components take care of it:

<Selection
  children: JSX.Element | JSX.Element[]
  enabled?: boolean
>

<Select
  children: JSX.Element | JSX.Element[]
  enabled?: boolean
>


You wrap everything into a selection, this one holds all the selections. Now you can individually select objects or groups. Effects that support selections (for instance Outline) will acknowledge it.

<Selection>
  <EffectComposer autoClear={false}>
    <Outline blur edgeStrength={100} />
  </EffectComposer>
  <Select enabled>
    <mesh />
  </Select>
</Selection>


Selection can be nested and group multiple object, higher up selection take precence over lower ones. The following for instance will select everything. Remove the outmost enabled and only the two mesh group is selected. You can flip the selections or bind them to interactions and state.

<Select enabled>
  <Select enabled>
    <mesh />
    <mesh />
  </Select>
  <Select>
    <mesh />
  </Select>
</Select>


Edit this page

Previous

Introduction

Next

Autofocus





root





EffectComposer



Selection



effects

On This Page



Autofocus

An auto-focus effect, that extends <DepthOfField>.

Based on ektogamat/AutoFocusDOF.

export type AutofocusProps = typeof DepthOfField & {
  target?: [number, number, number] // undefined
  mouse?: boolean // false
  debug?: number // undefined
  manual?: boolean // false
  smoothTime?: number // .25
}


<EffectComposer>
  <Autofocus />
</EffectComposer>


Ref-api:

type AutofocusApi = {
  dofRef: RefObject<DepthOfFieldEffect>
  hitpoint: THREE.Vector3
  update: (delta: number, updateTarget: boolean) => void
}


<Autofocus ref={autofocusRef} />


Associated with manual prop, you can for example, animate the DOF target yourself:

useFrame((_, delta) => {
  const api = autofocusRef.current
  api.update(delta, false) // update hitpoint only
  easing.damp3(api.dofRef.curent.target, api.hitpoint, 0.5, delta) // custom easing
})


Example



Bloom

A bloom effect.

import { Bloom } from '@react-three/postprocessing'
import { BlurPass, Resizer, KernelSize, Resolution } from 'postprocessing'

return (
  <Bloom
    intensity={1.0} // The bloom intensity.
    blurPass={undefined} // A blur pass.
    kernelSize={KernelSize.LARGE} // blur kernel size
    luminanceThreshold={0.9} // luminance threshold. Raise this value to mask out darker elements in the scene.
    luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
    mipmapBlur={false} // Enables or disables mipmap blur.
    resolutionX={Resolution.AUTO_SIZE} // The horizontal resolution.
    resolutionY={Resolution.AUTO_SIZE} // The vertical resolution.
  />
)


Bloom is selective by default, you control it not on the effect pass but on the materials by lifting their colors out of 0-1 range. a luminanceThreshold of 1 ensures that ootb nothing will glow, only the materials you pick. For this to work toneMapped has to be false on the materials, because it would otherwise clamp colors between 0 and 1 again.

<Bloom mipmapBlur luminanceThreshold={1} />

// ❌ will not glow, same as RGB [1,0,0]
<meshStandardMaterial color="red"/>

// ✅ will glow, same as RGB [2,0,0]
<meshStandardMaterial emissive="red" emissiveIntensity={2} toneMapped={false} />

// ❌ will not glow, same as RGB [1,0,0]
<meshBasicMaterial color="red" />

// ❌ will not glow, same as RGB [1,0,0], tone-mapping will clamp colors between 0 and 1
<meshBasicMaterial color={[2,0,0]} />

// ✅ will glow, same as RGB [2,0,0]
<meshBasicMaterial color={[2,0,0]} toneMapped={false} />


Example

react-postprocessing SSAO, SMAA and Bloom demo

Props

NameTypeDefaultDescriptionluminanceThresholdNumber0.9The luminance threshold. Raise this value to mask out darker elements in the scene. Range is [0, 1].luminanceSmoothingNumber0.025Controls the smoothness of the luminance threshold. Range is [0, 1].blendFunctionBlendFunctionBlendFunction.SCREENThe blend function of this effect.intensityNumber1The intensity.resolutionXNumberResizer.AUTO_SIZEThe render width.resolutionYNumberResizer.AUTO_SIZEThe render height.kernelSizeNumberKernelSize.LARGEThe blur kernel size.blurPassBlurPassnullAn efficient, incremental blur pass.mipMapBoolean

DepthOfField

A depth of field effect.

Based on a graphics study by Adrian Courrèges and an article by Steve Avery: https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/ https://pixelmischiefblog.wordpress.com/2016/11/25/bokeh-depth-of-field/

import { DepthOfField } from '@react-three/postprocessing'

return (
  <DepthOfField
    focusDistance={0} // where to focus
    focalLength={0.02} // focal length
    bokehScale={2} // bokeh size
  />
)


Example

DepthOfField Demo

Props

NameTypeDefaultDescriptionblendFunctionBlendFunctionBlendFunction.NORMALThe blend function of this effect.focusDistanceNumber0The normalized focus distance. Range is [0.0, 1.0].focalLengthNumber0.1The focal length. Range is [0.0, 1.0].bokehScaleNumber1.0The scale of the bokeh blur.widthNumberResizer.widthThe render width.heightNumberResizer.heightThe render height.



Glitch

A glitch effect.

import { Glitch } from '@react-three/postprocessing'
import { GlitchMode } from 'postprocessing'

return (
  <Glitch
    delay={[1.5, 3.5]} // min and max glitch delay
    duration={[0.6, 1.0]} // min and max glitch duration
    strength={[0.3, 1.0]} // min and max glitch strength
    mode={GlitchMode.SPORADIC} // glitch mode
    active // turn on/off the effect (switches between "mode" prop and GlitchMode.DISABLED)
    ratio={0.85} // Threshold for strong glitches, 0 - no weak glitches, 1 - no strong glitches.
  />
)


Example

Glitch Demo

Props

NameTypeDefaultDescriptionactiveBooleantrueTurn the effect on and offblendFunctionBlendFunctionBlendFunction.NORMALThe blend function of this effect.chromaticAberrationOffsetVector2A chromatic aberration offset. If provided, the glitch effect will influence this offset.delayVector2The minimum and maximum delay between glitch activations in seconds.durationVector2The minimum and maximum duration of a glitch in seconds.strengthVector2The strength of weak and strong glitches.perturbationMapTextureA perturbation map. If none is provided, a noise texture will be created.dtSizeNumber64The size of the generated noise map. Will be ignored if a perturbation map is provided.columnsNumber0.05The scale of the blocky glitch columns.ratioNumber0.85The threshold for strong glitches.

Edit this page

Previous

Dot Screen



GodRays

The GodRays effect requires a mesh that will be used as an origin point for the rays. Refer to this example for more details.

import { GodRays } from '@react-three/postprocessing'

return (
  <GodRays
    sun={sunRef}
    blendFunction={BlendFunction.Screen} // The blend function of this effect.
    samples={60} // The number of samples per pixel.
    density={0.96} // The density of the light rays.
    decay={0.9} // An illumination decay factor.
    weight={0.4} // A light ray weight factor.
    exposure={0.6} // A constant attenuation coefficient.
    clampMax={1} // An upper bound for the saturation of the overall effect.
    width={Resizer.AUTO_SIZE} // Render width.
    height={Resizer.AUTO_SIZE} // Render height.
    kernelSize={KernelSize.SMALL} // The blur kernel size. Has no effect if blur is disabled.
    blur={true} // Whether the god rays should be blurred to reduce artifacts.
  />
)


Props

NameTypeDefaultDescriptionsunRefThe light source. Must not write depth and has to be flagged as transparent.blendFunctionBlendFunctionBlendFunction.ScreenThe blend function of this effect.samplesNumber60The number of samples per pixel.densityNumber0.96The density of the light rays.decayNumber0.9An illumination decay factor.weightNumber0.4A light ray weight factor.exposureNumber0.6A constant attenuation coefficient.clampMaxNumber1An upper bound for the saturation of the overall effect.widthNumberResizer.AUTO_SIZEThe render width.heightNumberResizer.AUTO_SIZEThe render height.kernelSizeKernelSizeKernelSize.SMALLThe blur kernel size. Has no effect if blur is disabled.blurBooleantrueWhether the god rays should be blurred to reduce artifacts

Grid

A Grid effect

import { Grid } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

return (
  <Grid
    blendFunction={BlendFunction.OVERLAY} // blend mode
    scale={1.0} // grid pattern scale
    lineWidth={0.0} // grid pattern line width
    size={{ width, height }} // overrides the default pass width and height
  />
)


Example

Grid Demo

Props

NameTypeDefaultDescriptionblendFunctionBlendFunctionBlendFunction.NORMALThe blend function of this effect.scaleNumber1The scale of the grid pattern.lineWidthNumber0The blend function of this effect.widthNumberOverrides the default pass widthheightNumberOverrides the default pass height



Ramp

Ramp effect for linear and radial color gradients, as well as masking of effects before it in the effect array.

import { Ramp, RampType } from '@react-three/postprocessing'

return (
  <Ramp
    rampType={RampType.Linear}
    rampStart={[0.5, 0.5]}
    rampEnd={[1.0, 1.0]}
    startColor={[0, 0, 0, 1]}
    endColor={[1, 1, 1, 1]}
    rampBias={0.5}
    rampGain={0.5}
    rampMask={false}
    rampInvert={false}
  />
)


Example

Ramp Effect w/ postprocessing

Props

NameTypeDefaultDescriptionrampTypeRampTypeRampType.LinearType of ramp gradient.rampStart[x: number, y: number][0.5, 0.5]Starting point of the ramp gradient in normalized coordinates.rampEnd[x: number, y: number][1.0, 1.0]Ending point of the ramp gradient in normalized coordinates.startColor[r: number, g: number, b: number, a: number][0, 0, 0, 1]Color at the starting point of the gradient.endColor[r: number, g: number, b: number, a: number][1, 1, 1, 1]Color at the ending point of the gradient.rampBiasnumber0.5Bias for the interpolation curve when both bias and gain are 0.5.rampGainnumber0.5Gain for the interpolation curve when both bias and gain are 0.5.rampMaskbooleanfalseWhen enabled, the ramp gradient is used as an effect mask, and colors are ignored.rampInvertbooleanfalseControls whether the ramp gradient is inverted. When disabled, rampStart is transparent and rampEnd is opaque.
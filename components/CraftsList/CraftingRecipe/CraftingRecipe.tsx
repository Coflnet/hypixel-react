'use client'
import React, { useEffect, useState } from 'react'
import api from '../../../api/ApiHelper'
import { convertTagToName } from '../../../utils/Formatter'
import ArrowRightIcon from '@mui/icons-material/ArrowRightAlt'
import styles from './CraftingRecipe.module.css'
import Image from 'next/image'

interface Props {
    itemTag: string
    onIngredientClick?(tag: string)
}

export function CraftingRecipe(props: Props) {
    let [recipe, setRecipe] = useState<CraftingRecipe>()

    useEffect(() => {
        api.getCraftingRecipe(props.itemTag).then(recipe => {
            setRecipe(recipe)
        })
    }, [props.itemTag])

    function onIngredientClick(tag) {
        if (props.onIngredientClick) {
            props.onIngredientClick(tag)
        }
    }

    let style = {
        cursor: props.onIngredientClick ? 'pointer' : 'default'
    } as React.CSSProperties

    function getGridElement(craftingRecipeSlot: CraftingRecipeSlot | undefined) {
        if (!craftingRecipeSlot) {
            return <div style={{ height: '36px', width: '36px' }} />
        }
        return (
            <div
                onClick={() => {
                    onIngredientClick(craftingRecipeSlot.tag)
                }}
                style={style}
                className={styles.gridCell}
            >
                <div style={{ position: 'relative' }}>
                    <Image
                        title={convertTagToName(craftingRecipeSlot.tag)}
                        className={styles.ingredienceImage}
                        src={api.getItemImageUrl({ tag: craftingRecipeSlot.tag })}
                        alt=""
                        crossOrigin="anonymous"
                        height={36}
                        width={36}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        {craftingRecipeSlot.count}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.craftingTable}>
            <div className={styles.grid}>
                {getGridElement(recipe?.A1)}
                {getGridElement(recipe?.A2)}
                {getGridElement(recipe?.A3)}
                {getGridElement(recipe?.B1)}
                {getGridElement(recipe?.B2)}
                {getGridElement(recipe?.B3)}
                {getGridElement(recipe?.C1)}
                {getGridElement(recipe?.C2)}
                {getGridElement(recipe?.C3)}
            </div>
            <div className={styles.arrow}>
                <ArrowRightIcon fontSize="inherit" />
            </div>
            <div className={styles.result}>
                <div
                    onClick={() => {
                        onIngredientClick(props.itemTag)
                    }}
                    style={style}
                    className={styles.gridCell}
                >
                    <Image
                        title={convertTagToName(props.itemTag)}
                        className={styles.ingredienceImage}
                        src={api.getItemImageUrl({ tag: props.itemTag })}
                        alt=""
                        crossOrigin="anonymous"
                        height={36}
                        width={36}
                    />
                </div>
            </div>
        </div>
    )
}

import { Badge, Card, Image, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import styles from './FlipRestrictionEntry.module.css'
import ApiSearchField from '../../../Search/ApiSearchField'
import { getStyleForTier } from '../../../../utils/Formatter'
import Tooltip from '../../../Tooltip/Tooltip'
import SaveIcon from '@mui/icons-material/Save'
import ItemFilterPropertiesDisplay from '../../../ItemFilter/ItemFilterPropertiesDisplay'
import api from '../../../../api/ApiHelper'
import EditIcon from '@mui/icons-material/Edit'
import DuplicateIcon from '@mui/icons-material/ControlPointDuplicate'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
    restriction: FlipRestriction
    isAnyRestrictionInEditMode: boolean
    onSaveClick(): void
    onEditClick(): void
    onCreateDuplicateClick(): void
    onDeleteClick(): void
    onRemoveFilterClick(restriction: FlipRestriction): void
    onRestrictionChange(restriction: FlipRestriction): void
    style: React.CSSProperties
}

export default function FlipRestrictionListEntry(props: Props) {
    return (
        <div className={styles.restrictionContainer} style={props.style}>
            <Card className={`${styles.restriction} ${props.restriction.isEdited ? styles.restrictionMarkedAsEdit : ''}`}>
                <Card.Header
                    style={{
                        padding: '10px',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}
                >
                    {props.restriction.isEdited ? (
                        <ToggleButtonGroup
                            style={{ maxWidth: '200px', marginBottom: '5px' }}
                            type="radio"
                            name="options"
                            value={props.restriction.type}
                            onChange={newValue => {
                                let newRestriction = { ...props.restriction }
                                newRestriction.type = newValue as 'blacklist' | 'whitelist'
                                props.onRestrictionChange(newRestriction)
                            }}
                        >
                            <ToggleButton
                                id={'blacklistToggleButton-' + props.restriction.itemKey}
                                value={'blacklist'}
                                variant={props.restriction.type === 'blacklist' ? 'primary' : 'secondary'}
                                size="sm"
                            >
                                Blacklist
                            </ToggleButton>
                            <ToggleButton
                                id={'whitelistToggleButton-' + props.restriction.itemKey}
                                value={'whitelist'}
                                variant={props.restriction.type === 'whitelist' ? 'primary' : 'secondary'}
                                size="sm"
                            >
                                Whitelist
                            </ToggleButton>
                        </ToggleButtonGroup>
                    ) : (
                        <Badge style={{ marginRight: '10px' }} bg={props.restriction.type === 'blacklist' ? 'danger' : 'success'}>
                            {props.restriction.type.toUpperCase()}
                        </Badge>
                    )}
                    <div
                        style={{
                            width: '-webkit-fill-available',
                            float: 'left'
                        }}
                    >
                        {props.restriction.isEdited ? (
                            <ApiSearchField
                                multiple={false}
                                className={styles.multiSearch}
                                onChange={(items, text) => {
                                    // If the user only deletes part of the text, we don't want to remove the item (and therefore rerender the entry)
                                    if (items.length === 0 && text != '') return

                                    let newItem: Item | undefined =
                                        items && items.length > 0
                                            ? {
                                                  tag: items[0].id,
                                                  name: items[0].dataItem.name,
                                                  iconUrl: items[0].dataItem.iconUrl
                                              }
                                            : undefined
                                    let newRestriction = { ...props.restriction }
                                    newRestriction.item = newItem
                                    props.onRestrictionChange(newRestriction)
                                }}
                                searchFunction={api.itemSearch}
                                defaultSelected={
                                    props.restriction.item
                                        ? [
                                              {
                                                  dataItem: {
                                                      iconUrl: props.restriction.item.iconUrl || '',
                                                      name: props.restriction.item.name || '-'
                                                  },
                                                  id: props.restriction.item.tag || '',
                                                  label: props.restriction.item.name || '-'
                                              } as unknown as SearchResultItem
                                          ]
                                        : undefined
                                }
                            />
                        ) : (
                            props.restriction.item && (
                                <>
                                    <Image
                                        crossOrigin="anonymous"
                                        src={props.restriction.item?.iconUrl || ''}
                                        height="24"
                                        width="24"
                                        alt=""
                                        style={{
                                            marginRight: '5px'
                                        }}
                                        loading="lazy"
                                    />
                                    <span style={getStyleForTier(props.restriction.item?.tier)}>{props.restriction.item?.name}</span>
                                </>
                            )
                        )}
                    </div>
                    <div
                        style={{
                            display: 'flex'
                        }}
                    >
                        {props.restriction.isEdited ? (
                            <div
                                className={styles.cancelEditButton}
                                onClick={() => {
                                    props.onSaveClick()
                                }}
                            >
                                <Tooltip type="hover" content={<SaveIcon />} tooltipContent={<p>Save</p>} />
                            </div>
                        ) : (
                            <div className={styles.editButton} onClick={props.onEditClick}>
                                <Tooltip type="hover" content={<EditIcon />} tooltipContent={<p>Edit restriction</p>} />
                            </div>
                        )}
                        {!props.isAnyRestrictionInEditMode ? (
                            <>
                                <div className={styles.removeFilter} onClick={props.onCreateDuplicateClick}>
                                    <Tooltip type="hover" content={<DuplicateIcon />} tooltipContent={<p>Create duplicate</p>} />
                                </div>
                                <div className={styles.removeFilter} onClick={props.onDeleteClick}>
                                    <Tooltip type="hover" content={<DeleteIcon color="error" />} tooltipContent={<p>Remove restriction</p>} />
                                </div>
                            </>
                        ) : null}
                    </div>
                </Card.Header>
                <Card.Body>
                    {props.restriction.itemFilter ? (
                        <ItemFilterPropertiesDisplay
                            key={props.restriction.itemKey}
                            filter={props.restriction.itemFilter}
                            isEditable={props.restriction.isEdited}
                            onAfterEdit={filter => {
                                let newRestriction = { ...props.restriction }
                                newRestriction.itemFilter = filter
                                props.onRestrictionChange(newRestriction)
                            }}
                        />
                    ) : null}
                    <div className="ellipse">
                        {props.restriction.tags?.map(tag => (
                            <Badge
                                key={tag}
                                bg="dark"
                                style={{
                                    marginRight: '5px'
                                }}
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </Card.Body>
            </Card>
        </div>
    )
}

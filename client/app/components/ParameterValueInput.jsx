import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { react2angular } from 'react2angular';
import Button from 'antd/lib/button';
import Dropdown from 'antd/lib/dropdown';
import Select from 'antd/lib/select';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Icon from 'antd/lib/icon';
import Menu from 'antd/lib/menu';
import Tooltip from 'antd/lib/tooltip';
import EditDateParameterDialog from '@/components/EditDateParameterDialog';
import { defer, isFunction } from 'lodash';
import { DateInput } from './DateInput';
import { DateRangeInput } from './DateRangeInput';
import { DateTimeInput } from './DateTimeInput';
import { DateTimeRangeInput } from './DateTimeRangeInput';
import { QueryBasedParameterInput } from './QueryBasedParameterInput';

import './ParameterValueInput.less';

const { Option } = Select;

// TODO: Send DynamicButton somewhere else and optmize for different parameter types

const DATE_INTERVAL_OPTIONS = [
  { name: 'Last week', value: 'd_last_week' },
  { name: 'Last month', value: 'd_last_month' },
  { name: 'Last year', value: 'd_last_year' },
  { name: 'Last 7 days', value: 'd_last_7_days' },
];

function DynamicButton({ onSelect, enabled }) {
  const menu = (
    <Menu
      className="dynamic-menu"
      onClick={({ key }) => onSelect(key)}
    >
      <Menu.Item key="static">
        Static value
      </Menu.Item>
      {DATE_INTERVAL_OPTIONS.map(option => (
        <Menu.Item key={option.value}>
          {option.name} <em>Jan 1 - Jan 7</em>
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <a onClick={e => e.stopPropagation()}>
      <Dropdown.Button
        overlay={menu}
        className="dynamic-button"
        placement="bottomRight"
        trigger={['click']}
        icon={(
          <Icon
            type="thunderbolt"
            theme={enabled ? 'filled' : 'outlined'}
            className="dynamic-icon"
          />
        )}
      />
    </a>
  );
}

DynamicButton.propTypes = {
  onSelect: PropTypes.func,
  enabled: PropTypes.bool,
};

DynamicButton.defaultProps = {
  onSelect: () => {},
  enabled: false,
};

export class ParameterValueInput extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    enumOptions: PropTypes.string,
    queryId: PropTypes.number,
    parameter: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    applyButton: PropTypes.bool,
    onSelect: PropTypes.func,
    className: PropTypes.string,
  };

  static defaultProps = {
    type: 'text',
    value: null,
    enumOptions: '',
    queryId: null,
    parameter: null,
    applyButton: false,
    onSelect: () => {},
    className: '',
  };

  constructor(props) {
    super(props);
    this.state = {
      value: props.value,
      hasDynamicDateTime: !!(props.parameter && props.parameter.hasDynamicValue),
    };
  }

  openDateParameterDialog = (e) => {
    e.stopPropagation();

    const { onSelect, parameter } = this.props;
    EditDateParameterDialog.showModal({ defaultValue: parameter.value }).result
      .then((datePeriod) => {
        if (datePeriod) {
          onSelect(datePeriod.value);
        } else {
          onSelect(parameter.getValue());
        }
        this.setState({ hasDynamicDateTime: parameter.hasDynamicValue });
      });
  };

  onDynamicValueSelect = (dynamicValue) => {
    const { onSelect, parameter } = this.props;
    if (dynamicValue === 'static') {
      this.setState({ hasDynamicDateTime: false }, () => onSelect(parameter.getValue()));
    } else {
      onSelect(dynamicValue);
      this.setState({ hasDynamicDateTime: true });
    }
  }

  renderApplyButton() {
    const { onSelect } = this.props;
    const { value } = this.state;
    return (
      <Button
        className="parameter-apply-button"
        type="primary"
        size="small"
        onClick={() => onSelect(value)}
      >
        Apply
      </Button>
    );
  }

  renderDynamicOptionButton() {
    return (
      <Tooltip title="Dynamic Options">
        <Icon
          className="clickable"
          type="thunderbolt"
          theme="twoTone"
          onClick={this.openDateParameterDialog}
        />
      </Tooltip>
    );
  }

  renderDateTimeWithSecondsInput() {
    const { value, onSelect } = this.props;
    return (
      <DateTimeInput
        className={this.props.className}
        value={value}
        onSelect={onSelect}
        withSeconds
      />
    );
  }

  renderDateTimeInput() {
    const { value, onSelect } = this.props;
    return (
      <DateTimeInput
        className={this.props.className}
        value={value}
        onSelect={onSelect}
      />
    );
  }

  renderDateInput() {
    const { value, onSelect } = this.props;
    return (
      <DateInput
        className={this.props.className}
        value={value}
        onSelect={onSelect}
      />
    );
  }

  renderDateTimeRangeWithSecondsInput() {
    const { value, onSelect } = this.props;
    return (
      <DateTimeRangeInput
        className={this.props.className}
        value={value}
        onSelect={onSelect}
        withSeconds
        suffixIcon={this.renderDynamicOptionButton()}
        allowClear={false}
      />
    );
  }

  renderDateTimeRangeInput() {
    const { value, onSelect } = this.props;
    return (
      <DateTimeRangeInput
        className={this.props.className}
        value={value}
        onSelect={onSelect}
        suffixIcon={this.renderDynamicOptionButton()}
        allowClear={false}
      />
    );
  }

  renderDateRangeInput() {
    const { value, parameter, onSelect } = this.props;
    const { hasDynamicDateTime } = this.state;
    return (
      <DateRangeInput
        className={classNames('redash-datepicker', { 'dynamic-value': hasDynamicDateTime }, this.props.className)}
        value={value}
        {...hasDynamicDateTime && ({ placeholder: [parameter.dynamicValue && parameter.dynamicValue.name] })}
        onSelect={selectedValue => this.setState({ hasDynamicDateTime: false }, () => onSelect(selectedValue))}
        suffixIcon={(
          <DynamicButton
            enabled={hasDynamicDateTime}
            onSelect={this.onDynamicValueSelect}
          />
        )}
        hideValue={hasDynamicDateTime}
        allowClear={false}
      />
    );
  }

  renderEnumInput() {
    const { value, onSelect, enumOptions } = this.props;
    const enumOptionsArray = enumOptions.split('\n').filter(v => v !== '');
    return (
      <Select
        className={this.props.className}
        disabled={enumOptionsArray.length === 0}
        defaultValue={value}
        onChange={onSelect}
        dropdownMatchSelectWidth={false}
        dropdownClassName="ant-dropdown-in-bootstrap-modal"
      >
        {enumOptionsArray.map(option => (<Option key={option} value={option}>{ option }</Option>))}
      </Select>
    );
  }

  renderQueryBasedInput() {
    const { value, onSelect, queryId, parameter } = this.props;
    return (
      <QueryBasedParameterInput
        className={this.props.className}
        parameter={parameter}
        value={value}
        queryId={queryId}
        onSelect={onSelect}
      />
    );
  }

  renderNumberInput() {
    const { className, onSelect, applyButton } = this.props;
    const { value } = this.state;
    const showApplyButton = applyButton && value !== this.props.value;

    const onChange = (newValue) => {
      this.setState({ value: newValue });
      if (!applyButton) {
        onSelect(newValue);
      }
    };

    return (
      <div className="parameter-input-number" data-dirty={showApplyButton || null}>
        <InputNumber
          className={className}
          value={!isNaN(value) && value || 0}
          onChange={onChange}
          onKeyUp={showApplyButton ? (e) => {
            const keyNumber = e.which || e.keyCode;
            if (keyNumber === 13 && !e.ctrlKey && !e.metaKey) { // enter key
              onSelect(value);
            }
          } : null}
        />
        {showApplyButton && this.renderApplyButton()}
      </div>
    );
  }

  renderTextInput() {
    const { className, onSelect, applyButton } = this.props;
    const { value } = this.state;
    const showApplyButton = applyButton && value !== this.props.value;

    const onChange = (event) => {
      this.setState({ value: event.target.value });
      if (!applyButton) {
        onSelect(event.target.value);
      }
    };

    return (
      <div className="parameter-input" data-dirty={showApplyButton || null}>
        <Input
          className={className}
          value={value || ''}
          data-test="TextParamInput"
          onChange={onChange}
          onPressEnter={showApplyButton ? (e) => {
            if (!e.ctrlKey && !e.metaKey) {
              onSelect(value);
            }
          } : null}
        />
        {showApplyButton && this.renderApplyButton()}
      </div>
    );
  }

  render() {
    const { type } = this.props;
    switch (type) {
      case 'datetime-with-seconds': return this.renderDateTimeWithSecondsInput();
      case 'datetime-local': return this.renderDateTimeInput();
      case 'date': return this.renderDateInput();
      case 'datetime-range-with-seconds': return this.renderDateTimeRangeWithSecondsInput();
      case 'datetime-range': return this.renderDateTimeRangeInput();
      case 'date-range': return this.renderDateRangeInput();
      case 'enum': return this.renderEnumInput();
      case 'query': return this.renderQueryBasedInput();
      case 'number': return this.renderNumberInput();
      default: return this.renderTextInput();
    }
  }
}

export default function init(ngModule) {
  ngModule.component('parameterValueInput', {
    template: `
      <parameter-value-input-impl
        type="$ctrl.param.type"
        value="$ctrl.param.normalizedValue"
        parameter="$ctrl.param"
        enum-options="$ctrl.param.enumOptions"
        query-id="$ctrl.param.queryId"
        on-select="$ctrl.setValue"
        apply-button="$ctrl.applyButton"
      ></parameter-value-input-impl>
    `,
    bindings: {
      param: '<',
      applyButton: '=?',
      onChange: '=',
    },
    controller($scope) {
      this.setValue = (value) => {
        this.param.setValue(value);
        defer(() => {
          $scope.$apply();
          if (isFunction(this.onChange)) {
            this.onChange();
          }
        });
      };
    },
  });
  ngModule.component('parameterValueInputImpl', react2angular(ParameterValueInput));
}

init.init = true;
